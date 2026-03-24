import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";

const AUTH_COOKIE_NAME = "ss_session";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SESSION_MS = 14 * DAY_MS; // Firebase session cookie max is 14 days

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { idToken?: string; remember?: boolean }
      | null;

    const idToken = body?.idToken;
    const remember = Boolean(body?.remember);

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const expiresIn = remember ? MAX_SESSION_MS : DAY_MS;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // If remember=false, keep it as a browser-session cookie (no maxAge).
      ...(remember ? { maxAge: Math.floor(expiresIn / 1000) } : {}),
    });

    return res;
  } catch (err) {
    console.error("SESSION COOKIE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

