import { NextResponse } from "next/server";
import {
  PAID_CREDIT_PACKS,
  purchasePaidCredits,
} from "@/app/lib/creditLogic";
import { getRequestUser } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";

type PurchaseCreditsBody = {
  packId?: keyof typeof PAID_CREDIT_PACKS;
};

export async function GET() {
  return NextResponse.json({ packs: PAID_CREDIT_PACKS });
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PurchaseCreditsBody;
    const packId = body.packId;

    if (!packId || !(packId in PAID_CREDIT_PACKS)) {
      return NextResponse.json({ error: "Please choose a valid credit pack" }, { status: 400 });
    }

    const result = await purchasePaidCredits({
      userId: sessionUser.uid.trim(),
      packId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json({ error: "Failed to purchase credits" }, { status: 500 });
  }
}
