import { NextResponse } from "next/server";
import { getRequestUser } from "@/app/lib/serverAuth";
import {
  scheduleSessionWithCreditDebit,
  updateSessionStatusWithCredits,
} from "@/app/lib/creditLogic";
import { pairId } from "@/app/lib/skill-request-utils";

export const dynamic = "force-dynamic";

type ScheduleSessionBody = {
  peerId?: string;
  chatId?: string;
  scheduleMessageId?: string;
};

type UpdateSessionBody = {
  sessionId?: string;
  status?: "completed" | "cancelled";
  action?: "complete" | "cancel";
  rewardBonusCredit?: boolean;
};

function creditErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  switch (message) {
    case "INSUFFICIENT_CREDITS":
      return NextResponse.json(
        { error: "The requester needs at least 1 credit to schedule this meeting." },
        { status: 402 },
      );
    case "FORBIDDEN":
    case "REQUESTER_CANNOT_ACCEPT_OWN_SCHEDULE":
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    case "SCHEDULE_MESSAGE_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    default:
      console.error("Session credit error:", error);
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ScheduleSessionBody;
    const actorId = sessionUser.uid.trim();
    const peerId = body.peerId?.trim();
    const scheduleMessageId = body.scheduleMessageId?.trim();
    const chatId = body.chatId?.trim() || (peerId ? pairId(actorId, peerId) : "");

    if (!chatId || !scheduleMessageId) {
      return NextResponse.json(
        { error: "chatId and scheduleMessageId are required" },
        { status: 400 },
      );
    }

    const sessionId = `${chatId}_${scheduleMessageId}`;
    const result = await scheduleSessionWithCreditDebit({
      sessionId,
      chatId,
      scheduleMessageId,
      actorId,
    });

    return NextResponse.json({ ok: true, sessionId, ...result });
  } catch (error) {
    return creditErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getRequestUser(req);
    if (!sessionUser?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as UpdateSessionBody;
    const sessionId = body.sessionId?.trim();
    const status =
      body.status || (body.action === "complete" ? "completed" : body.action === "cancel" ? "cancelled" : null);

    if (!sessionId || (status !== "completed" && status !== "cancelled")) {
      return NextResponse.json(
        { error: "sessionId and a completed/cancelled status are required" },
        { status: 400 },
      );
    }

    const result = await updateSessionStatusWithCredits({
      sessionId,
      actorId: sessionUser.uid.trim(),
      status,
      rewardBonusCredit: body.rewardBonusCredit,
    });

    return NextResponse.json({ ok: true, sessionId, ...result });
  } catch (error) {
    return creditErrorResponse(error);
  }
}
