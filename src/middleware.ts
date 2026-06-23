import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "ss_session";
const LAST_PATH_COOKIE_NAME = "ss_last_path";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/trendingskills",
  "/signin",
  "/signup",
  "/forgot-password",
  "/learner"
];

function isPublicPath(pathname: string) {
  // Exact "/" is public; for others treat prefix + "/" as public.
  return PUBLIC_PATH_PREFIXES.some((p) => {
    if (p === "/") return pathname === "/";
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}

function isDocumentNavigation(request: NextRequest) {
  const fetchDest = request.headers.get("sec-fetch-dest");
  if (fetchDest === "document") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function isAddressBarNavigation(request: NextRequest) {
  // Heuristic: address bar / bookmark open often sends Sec-Fetch-Site: none.
  // In-app navigations and refreshes are typically same-origin.
  const fetchMode = request.headers.get("sec-fetch-mode");
  const fetchDest = request.headers.get("sec-fetch-dest");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    fetchMode === "navigate" && fetchDest === "document" && fetchSite === "none"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next internals & common public files
  if (
    pathname.startsWith("/_next") || // Next.js internals
    pathname.startsWith("/favicon") || // favicon
    pathname.startsWith("/images") || // public images
    pathname.startsWith("/assets") || // optional other public assets
    pathname.endsWith(".png") || // allow png, jpg, svg, etc.
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp")
  ) {
    return NextResponse.next();
  }

  // Keep APIs reachable (route protection here is for pages).
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Public pages (landing + marketing pages)
  const publicPath = isPublicPath(pathname);

  const session = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const lastPath = request.cookies.get(LAST_PATH_COOKIE_NAME)?.value;

  // If not logged in, block direct URL access to protected pages.
  if (!session && !publicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If logged in, don’t allow changing routes via manual typing/bookmarks.
  // Allow refresh of the same page by letting the user revisit `lastPath`.
  if (session && isAddressBarNavigation(request)) {
    const target = lastPath && lastPath !== pathname ? lastPath : null;
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!lastPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // If logged in, prevent going back to auth pages via URL.
  if (session && (pathname === "/signin" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // Track the last rendered page so refresh works but address-bar route changes can be blocked.
  if (session && isDocumentNavigation(request)) {
    res.cookies.set({
      name: LAST_PATH_COOKIE_NAME,
      value: pathname,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
