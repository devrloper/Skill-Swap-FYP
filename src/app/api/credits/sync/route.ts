import { NextResponse } from "next/server";
import { syncPassedInterviewCredits } from "@/app/lib/creditLogic";
import { getRequestUser } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncPassedInterviewCredits(sessionUser.uid.trim());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Credit sync error:", error);
    return NextResponse.json({ error: "Failed to sync credits" }, { status: 500 });
  }
}
