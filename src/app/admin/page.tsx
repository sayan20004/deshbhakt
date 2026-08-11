"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  Activity,
  Music,
  MessageSquare,
  RefreshCw,
  LogOut,
  Globe,
  Monitor,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */

interface Session {
  sessionId: string;
  nickname: string;
  userAgent: string;
  referrer: string;
  enteredAt: string;
  lastPingAt: string;
  timeSpentSeconds: number;
  songsPlayed: number;
  chatMessages: number;
}

interface HourBucket {
  hour: number;
  count: number;
}

interface Stats {
  onlineCount: number;
  todayCount: number;
  weekCount: number;
  totalCount: number;
  avgSeconds: number;
  hourlyHistogram: HourBucket[];
  sessions: Session[];
}

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────── */

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function getDevice(ua: string): "mobile" | "desktop" {
  return /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
}

function getBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Browser";
}

function isOnline(lastPingAt: string): boolean {
  return Date.now() - new Date(lastPingAt).getTime() < 65_000;
}

/* ─────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────── */

const gold = "#FFB300";
const saffron = "#FF6B00";
const maroon = "#8B0000";
const cream = "#FFF3E0";
const cardBg = "rgba(26,8,0,0.85)";
const cardBorder = "rgba(255,179,0,0.22)";

function StatCard({
  icon,
  label,
  value,
  sub,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  pulse?: boolean;
}) {
  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,179,0,0.08)`,
        flex: 1,
        minWidth: 160,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `linear-gradient(135deg,${saffron},${maroon})`,
          border: `1px solid ${gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px rgba(255,107,0,0.3)`,
          position: "relative",
        }}
      >
        {pulse && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px #22c55e",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        )}
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "rgba(255,243,224,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: gold, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,243,224,0.4)", marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function HourlyChart({ data }: { data: HourBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const now = new Date().getHours();

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 16,
        padding: "20px 24px",
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,179,0,0.08)`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: cream, marginBottom: 16, letterSpacing: "0.02em" }}>
        📊 Visits per Hour (last 24h)
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
        {data.map(({ hour, count }) => {
          const pct = (count / max) * 100;
          const isCurrent = hour === now;
          return (
            <div
              key={hour}
              title={`${hour}:00 — ${count} visit${count !== 1 ? "s" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 4,
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(pct, count > 0 ? 8 : 2)}%`,
                  borderRadius: "4px 4px 2px 2px",
                  background: isCurrent
                    ? `linear-gradient(to top,${saffron},${gold})`
                    : count > 0
                    ? `linear-gradient(to top,${maroon},${saffron})`
                    : "rgba(255,179,0,0.08)",
                  boxShadow: count > 0 ? `0 0 6px rgba(255,107,0,0.3)` : "none",
                  transition: "height 0.3s ease",
                  border: isCurrent ? `1px solid ${gold}` : "none",
                }}
              />
              {hour % 4 === 0 && (
                <div style={{ fontSize: 9, color: "rgba(255,243,224,0.3)", whiteSpace: "nowrap" }}>
                  {hour}h
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SortKey = "enteredAt" | "timeSpentSeconds" | "songsPlayed" | "chatMessages";

function SessionsTable({ sessions }: { sessions: Session[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("enteredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = sessions
    .filter(
      (s) =>
        s.nickname.toLowerCase().includes(search.toLowerCase()) ||
        s.referrer.toLowerCase().includes(search.toLowerCase()) ||
        getBrowser(s.userAgent).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = sortKey === "enteredAt" ? new Date(a[sortKey]).getTime() : (a[sortKey] as number);
      const bv = sortKey === "enteredAt" ? new Date(b[sortKey]).getTime() : (b[sortKey] as number);
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp style={{ width: 12, height: 12, display: "inline", marginLeft: 3 }} />
      ) : (
        <ChevronDown style={{ width: 12, height: 12, display: "inline", marginLeft: 3 }} />
      )
    ) : null;

  const th: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 10,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "rgba(255,179,0,0.6)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    borderBottom: `1px solid rgba(255,179,0,0.1)`,
  };

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 16,
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,179,0,0.08)`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid rgba(255,179,0,0.1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: cream }}>
          👥 Sessions ({filtered.length})
        </div>
        <input
          placeholder="Search nickname, browser, referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "rgba(255,179,0,0.06)",
            border: `1px solid rgba(255,179,0,0.2)`,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            color: cream,
            outline: "none",
            width: 240,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "rgba(26,8,0,0.95)" }}>
            <tr>
              <th style={th}>Status</th>
              <th style={th}>Nickname</th>
              <th style={th}>Browser / Device</th>
              <th style={{ ...th }} onClick={() => handleSort("enteredAt")}>
                Joined <SortIcon k="enteredAt" />
              </th>
              <th style={{ ...th }} onClick={() => handleSort("timeSpentSeconds")}>
                Time Spent <SortIcon k="timeSpentSeconds" />
              </th>
              <th style={{ ...th }} onClick={() => handleSort("songsPlayed")}>
                Songs <SortIcon k="songsPlayed" />
              </th>
              <th style={{ ...th }} onClick={() => handleSort("chatMessages")}>
                Chats <SortIcon k="chatMessages" />
              </th>
              <th style={th}>Referrer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "rgba(255,243,224,0.3)", fontSize: 13 }}>
                  No sessions found
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => {
                const online = isOnline(s.lastPingAt);
                const device = getDevice(s.userAgent);
                const browser = getBrowser(s.userAgent);
                const even = i % 2 === 0;
                const td: React.CSSProperties = {
                  padding: "10px 14px",
                  fontSize: 12,
                  color: cream,
                  borderBottom: `1px solid rgba(255,179,0,0.05)`,
                  whiteSpace: "nowrap",
                  background: even ? "transparent" : "rgba(255,179,0,0.02)",
                };
                return (
                  <tr key={s.sessionId} style={{ transition: "background 0.15s" }}>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                          background: online ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                          border: online ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                          color: online ? "#4ade80" : "rgba(255,243,224,0.4)",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: online ? "#22c55e" : "rgba(255,255,255,0.25)",
                            boxShadow: online ? "0 0 4px #22c55e" : "none",
                          }}
                        />
                        {online ? "Online" : "Left"}
                      </span>
                    </td>
                    <td style={{ ...td, fontWeight: 600, color: s.nickname === "Anonymous" ? "rgba(255,243,224,0.4)" : gold }}>
                      {s.nickname}
                    </td>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {device === "mobile" ? (
                          <Smartphone style={{ width: 12, height: 12, color: saffron }} />
                        ) : (
                          <Monitor style={{ width: 12, height: 12, color: saffron }} />
                        )}
                        {browser}
                      </span>
                    </td>
                    <td style={{ ...td, color: "rgba(255,243,224,0.55)" }}>
                      {formatDate(s.enteredAt)}
                    </td>
                    <td style={{ ...td, color: gold, fontWeight: 600 }}>
                      {formatTime(s.timeSpentSeconds)}
                    </td>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Music style={{ width: 11, height: 11, color: saffron }} />
                        {s.songsPlayed}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MessageSquare style={{ width: 11, height: 11, color: saffron }} />
                        {s.chatMessages}
                      </span>
                    </td>
                    <td style={{ ...td, color: "rgba(255,243,224,0.4)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.referrer || "direct"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Login Wall
───────────────────────────────────────────────────────────────────────── */

function LoginWall({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === "in-admin" && pass === "admin123") {
      sessionStorage.setItem("admin_authed", "1");
      onLogin();
    } else {
      setError("Invalid credentials");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg,#0d0400,#1a0800 40%,#0d0400)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Mandala glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,107,0,0.12) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          padding: "0 20px",
          animation: shaking ? "shake 0.4s ease" : "none",
        }}
      >
        {/* Card glow */}
        <div
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: 28,
            background: `radial-gradient(ellipse at center,rgba(255,107,0,0.2),transparent 70%)`,
            filter: "blur(16px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "linear-gradient(145deg,#1a0800,#2d0c00 50%,#1a0800)",
            border: `1px solid rgba(255,179,0,0.3)`,
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow: `0 8px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,179,0,0.12)`,
          }}
        >
          {/* Logo area */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 12px",
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 35%,#FF8C00,${maroon} 70%)`,
                border: `2px solid ${gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px rgba(255,107,0,0.4)`,
              }}
            >
              <Shield style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: gold, letterSpacing: "0.02em" }}>
              Admin Portal
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,243,224,0.4)", marginTop: 4 }}>
              🪔 Deshbhakt — Control Centre
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,179,0,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Username
              </label>
              <input
                autoComplete="username"
                value={user}
                onChange={(e) => { setUser(e.target.value); setError(""); }}
                style={{
                  marginTop: 6,
                  width: "100%",
                  background: "rgba(255,179,0,0.06)",
                  border: `1px solid rgba(255,179,0,0.2)`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  color: cream,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,179,0,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Password
              </label>
              <div style={{ position: "relative", marginTop: 6 }}>
                <input
                  autoComplete="current-password"
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setError(""); }}
                  style={{
                    width: "100%",
                    background: "rgba(255,179,0,0.06)",
                    border: `1px solid rgba(255,179,0,0.2)`,
                    borderRadius: 10,
                    padding: "10px 40px 10px 14px",
                    fontSize: 14,
                    color: cream,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,243,224,0.4)",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                marginTop: 4,
                padding: "12px",
                borderRadius: 12,
                background: `radial-gradient(circle at 40% 35%,#FF8C00,${maroon} 70%)`,
                border: `1.5px solid ${gold}`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 0 16px rgba(255,107,0,0.3)`,
                transition: "transform 0.15s",
                letterSpacing: "0.04em",
              }}
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(1.4)}
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Admin Page
───────────────────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState("");

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("admin_authed") === "1") {
        setAuthed(true);
      }
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-token": "admin123" },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchStats();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchStats, 30_000);
      return () => clearInterval(interval);
    }
  }, [authed, fetchStats]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authed");
    setAuthed(false);
    setStats(null);
  };

  if (!authed) {
    return <LoginWall onLogin={() => setAuthed(true)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg,#0d0400 0%,#1a0800 35%,#120500 70%,#0d0400 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: cream,
        padding: "0 0 60px",
      }}
    >
      {/* Background mandala glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%,rgba(255,107,0,0.08) 0%,transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Top Nav ── */}
        <nav
          style={{
            borderBottom: `1px solid rgba(255,179,0,0.15)`,
            background: "rgba(13,4,0,0.8)",
            backdropFilter: "blur(16px)",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Tiny lotus icon */}
            <svg width="22" height="22" viewBox="0 0 24 24">
              {[0,45,90,135,180,225,270,315].map((deg) => (
                <ellipse key={deg} cx="12" cy="12" rx="2" ry="4.5" fill="url(#ng)" transform={`rotate(${deg} 12 12)`} opacity="0.8"/>
              ))}
              <circle cx="12" cy="12" r="2" fill="#FFD700"/>
              <defs>
                <radialGradient id="ng">
                  <stop offset="0%" stopColor="#FF9500"/>
                  <stop offset="100%" stopColor="#8B0000"/>
                </radialGradient>
              </defs>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 800, color: gold, letterSpacing: "0.04em" }}>
              Deshbhakt Admin
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastRefresh && (
              <span style={{ fontSize: 11, color: "rgba(255,243,224,0.35)" }}>
                Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              onClick={fetchStats}
              disabled={loading}
              style={{
                background: "rgba(255,179,0,0.08)",
                border: `1px solid rgba(255,179,0,0.2)`,
                borderRadius: 8,
                color: gold,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: loading ? "default" : "pointer",
                fontSize: 12,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw style={{ width: 13, height: 13, animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(139,0,0,0.2)",
                border: `1px solid rgba(139,0,0,0.4)`,
                borderRadius: 8,
                color: "#f87171",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <LogOut style={{ width: 13, height: 13 }} />
              Logout
            </button>
          </div>
        </nav>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Page title */}
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: cream }}>
              Analytics Overview
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,243,224,0.4)" }}>
              Real-time visitor tracking for Deshbhakt 🇮🇳
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 13,
                color: "#f87171",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {!stats && !error && (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,243,224,0.3)", fontSize: 14 }}>
              <RefreshCw style={{ width: 24, height: 24, margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
              Loading analytics…
            </div>
          )}

          {stats && (
            <>
              {/* ── Stat cards ── */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <StatCard
                  icon={<Activity style={{ width: 20, height: 20, color: "#fff" }} />}
                  label="Online Now"
                  value={stats.onlineCount}
                  sub="Active in last 60s"
                  pulse
                />
                <StatCard
                  icon={<Users style={{ width: 20, height: 20, color: "#fff" }} />}
                  label="Today"
                  value={stats.todayCount}
                  sub="Unique sessions"
                />
                <StatCard
                  icon={<Globe style={{ width: 20, height: 20, color: "#fff" }} />}
                  label="This Week"
                  value={stats.weekCount}
                  sub="Last 7 days"
                />
                <StatCard
                  icon={<Users style={{ width: 20, height: 20, color: "#fff" }} />}
                  label="All Time"
                  value={stats.totalCount}
                  sub="Total sessions"
                />
                <StatCard
                  icon={<Clock style={{ width: 20, height: 20, color: "#fff" }} />}
                  label="Avg Time"
                  value={formatTime(stats.avgSeconds)}
                  sub="Per session"
                />
              </div>

              {/* ── Hourly chart ── */}
              <HourlyChart data={stats.hourlyHistogram} />

              {/* ── Sessions table ── */}
              <SessionsTable sessions={stats.sessions} />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(1.5)}
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: rgba(255,179,0,0.03); border-radius: 99px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,179,0,0.15); border-radius: 99px; }
        input::placeholder { color: rgba(255,243,224,0.25); }
      `}</style>
    </div>
  );
}
