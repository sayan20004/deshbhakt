import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const ADMIN_TOKEN = "admin123";

export async function GET(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("deshbhakt");
    const sessions = db.collection("sessions");

    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - 60 * 1000); // 60s ago
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [
      allSessions,
      onlineCount,
      todayCount,
      weekCount,
      totalCount,
      hourlyData,
      avgTimeResult,
    ] = await Promise.all([
      // Last 200 sessions sorted by most recent
      sessions
        .find({})
        .sort({ enteredAt: -1 })
        .limit(200)
        .project({
          sessionId: 1,
          nickname: 1,
          userAgent: 1,
          referrer: 1,
          enteredAt: 1,
          lastPingAt: 1,
          timeSpentSeconds: 1,
          songsPlayed: 1,
          chatMessages: 1,
        })
        .toArray(),

      // Online now (pinged in last 60s)
      sessions.countDocuments({ lastPingAt: { $gte: onlineThreshold } }),

      // Visitors today
      sessions.countDocuments({ enteredAt: { $gte: todayStart } }),

      // Visitors this week
      sessions.countDocuments({ enteredAt: { $gte: weekStart } }),

      // All-time
      sessions.countDocuments({}),

      // Visits per hour for the last 24 hours
      sessions
        .aggregate([
          { $match: { enteredAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $hour: "$enteredAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),

      // Average time spent
      sessions
        .aggregate([
          { $match: { timeSpentSeconds: { $gt: 0 } } },
          { $group: { _id: null, avg: { $avg: "$timeSpentSeconds" } } },
        ])
        .toArray(),
    ]);

    const avgSeconds = avgTimeResult[0]?.avg ?? 0;

    // Build hourly histogram (fill gaps with 0)
    const hourlyMap: Record<number, number> = {};
    hourlyData.forEach((h: any) => {
      hourlyMap[h._id] = h.count;
    });
    const hourlyHistogram = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyMap[i] ?? 0,
    }));

    return NextResponse.json({
      onlineCount,
      todayCount,
      weekCount,
      totalCount,
      avgSeconds: Math.round(avgSeconds),
      hourlyHistogram,
      sessions: allSessions,
    });
  } catch (err: any) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
