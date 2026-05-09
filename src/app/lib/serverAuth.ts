import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/app/lib/firebaseAdmin";

const AUTH_COOKIE_NAME = "ss_session";
const DEFAULT_ADMIN_EMAILS = ["aroobaadmin123@gmail.com"];

function getAdminEmailAllowlist(): string[] {
  const fromEnv =
    process.env.ADMIN_EMAILS?.split(",").map((s) => s.trim()).filter(Boolean) ??
    [];
  const list = fromEnv.length ? fromEnv : DEFAULT_ADMIN_EMAILS;
  return list.map((e) => e.toLowerCase());
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allow = getAdminEmailAllowlist();
  return allow.includes(email.toLowerCase());
}

export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifySessionCookie(token, true);
  } catch {
    return null;
  }
}

export async function getRequestUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (bearerToken) {
    try {
      return await adminAuth.verifyIdToken(bearerToken, true);
    } catch {
      return null;
    }
  }

  return getSessionUser();
}

export async function requireSessionUser(): Promise<DecodedIdToken> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireAdminSessionUser(): Promise<DecodedIdToken> {
  const user = await requireSessionUser();
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}
