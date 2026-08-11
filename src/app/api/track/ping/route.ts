import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const PRESENCE_TOPIC = "deshbhakt_presence_live_v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, nickname, songsPlayed, chatMessages } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("deshbhakt");
    const sessions = db.collection("sessions");

    const now = new Date();

    await sessions.updateOne(
      { sessionId },
      {
        $set: {
          lastPingAt: now,
          updatedAt: now,
          ...(nickname ? { nickname } : {}),
        },
        $inc: {
          timeSpentSeconds: 30,
          ...(typeof songsPlayed === "number" ? { songsPlayed } : {}),
          ...(typeof chatMessages === "number" ? { chatMessages } : {}),
        },
      }
    );

    // Count real online users (pinged in last 60s)
    const onlineCount = await sessions.countDocuments({
      lastPingAt: { $gte: new Date(now.getTime() - 60_000) },
    });

    // Broadcast real count to all connected browsers via ntfy.sh (fire-and-forget)
    fetch(`https://ntfy.sh/${PRESENCE_TOPIC}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "presence", count: onlineCount }),
    }).catch(() => {});

    return NextResponse.json({ ok: true, onlineCount });
  } catch (err: any) {
    console.error("[track/ping]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
