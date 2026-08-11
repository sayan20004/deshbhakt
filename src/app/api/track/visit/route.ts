import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const PRESENCE_TOPIC = "deshbhakt_presence_live_v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, nickname, referrer } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Extract IP from headers (works behind Vercel/Netlify/Nginx proxies)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const client = await clientPromise;
    const db = client.db("deshbhakt");
    const sessions = db.collection("sessions");

    const now = new Date();

    // Upsert — if same sessionId reconnects (e.g. refresh), just update lastPingAt
    await sessions.updateOne(
      { sessionId },
      {
        $set: {
          sessionId,
          nickname: nickname || "Anonymous",
          ip,
          userAgent,
          referrer: referrer || "direct",
          lastPingAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          enteredAt: now,
          timeSpentSeconds: 0,
          songsPlayed: 0,
          chatMessages: 0,
        },
      },
      { upsert: true }
    );

    // Count real online users (pinged in last 60s) and broadcast to all clients
    const onlineCount = await sessions.countDocuments({
      lastPingAt: { $gte: new Date(now.getTime() - 60_000) },
    });

    // Fire-and-forget broadcast via ntfy.sh
    fetch(`https://ntfy.sh/${PRESENCE_TOPIC}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "presence", count: onlineCount }),
    }).catch(() => {});

    return NextResponse.json({ ok: true, onlineCount });
  } catch (err: any) {
    console.error("[track/visit]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
