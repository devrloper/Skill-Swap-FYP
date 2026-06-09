type ZoomMeetingInput = {
  topic: string;
  startTime: string | Date;
  duration: number;
  agenda?: string;
};

type ZoomMeetingResult = {
  zoomMeetingId: string;
  joinUrl: string;
  startUrl: string;
  raw?: unknown;
};

function getZoomCredentials() {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  const userId = (process.env.ZOOM_USER_ID || process.env.ZOOM_USER_EMAIL)?.trim();

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("ZOOM_CONFIG_MISSING");
  }

  return { accountId, clientId, clientSecret, userId };
}

async function getZoomAccessToken() {
  const { accountId, clientId, clientSecret } = getZoomCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: accountId,
  });
  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.access_token !== "string") {
    console.error("Zoom token error:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });
    throw new Error("ZOOM_AUTH_FAILED");
  }

  return data.access_token as string;
}

export async function createZoomMeeting(input: ZoomMeetingInput): Promise<ZoomMeetingResult> {
  const { userId } = getZoomCredentials();
  const accessToken = await getZoomAccessToken();
  const startDate = input.startTime instanceof Date ? input.startTime : new Date(input.startTime);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("INVALID_MEETING_TIME");
  }

  const meetingUser = userId || "me";
  const response = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(meetingUser)}/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: startDate.toISOString(),
      duration: input.duration,
      timezone: "Asia/Karachi",
      agenda: input.agenda || input.topic,
      settings: {
        waiting_room: true,
        join_before_host: false,
        approval_type: 2,
        audio: "both",
        auto_recording: "none",
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Zoom meeting error:", {
      status: response.status,
      statusText: response.statusText,
      user: meetingUser,
      data,
    });
    throw new Error("ZOOM_MEETING_FAILED");
  }

  return {
    zoomMeetingId: String(data.id || ""),
    joinUrl: String(data.join_url || ""),
    startUrl: String(data.start_url || ""),
    raw: data,
  };
}
