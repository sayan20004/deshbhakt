"use client";

import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  ListMusic,
  Maximize2,
  Minimize2,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

interface Track {
  videoId: string;
  title: string;
  artist: string;
  art: string;
}

interface PlayerDashboardProps {
  track: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  onPlayPauseToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (percent: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onLoopToggle: () => void;
  onShuffleToggle: () => void;
  onOpenTracklist: () => void;
  onOpenChat: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────
   Decorative SVG motifs
───────────────────────────────────────────────────────────────────────── */

/** An 8-petal lotus / rangoli flower icon */
const LotusIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "inline-block", flexShrink: 0, pointerEvents: "none" }}
  >
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <ellipse
        key={deg}
        cx="12"
        cy="12"
        rx="2.2"
        ry="5"
        fill="url(#lg)"
        transform={`rotate(${deg} 12 12)`}
        opacity="0.8"
      />
    ))}
    <circle cx="12" cy="12" r="2.2" fill="#FFD700" />
    <defs>
      <radialGradient id="lg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF9500" />
        <stop offset="100%" stopColor="#c0392b" />
      </radialGradient>
    </defs>
  </svg>
);

/** Ornamental horizontal divider with a central diamond */
const OrnamentalDivider = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      width: "100%",
      opacity: 0.3,
    }}
  >
    <div
      style={{
        flex: 1,
        height: 1,
        background: "linear-gradient(to right, transparent, #FFB300)",
      }}
    />
    <svg width="10" height="10" viewBox="0 0 10 10">
      <polygon points="5,0 10,5 5,10 0,5" fill="#FFB300" />
    </svg>
    <div
      style={{
        flex: 1,
        height: 1,
        background: "linear-gradient(to left, transparent, #FFB300)",
      }}
    />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────── */

export default function PlayerDashboard({
  track,
  isPlaying,
  duration,
  currentTime,
  volume,
  isMuted,
  isLooping,
  isShuffled,
  onPlayPauseToggle,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onLoopToggle,
  onShuffleToggle,
  onOpenTracklist,
  onOpenChat,
  isMinimized,
  onToggleMinimize,
}: PlayerDashboardProps) {
  // Format seconds to M:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent);
  };

  /* ── design tokens ── */
  const gold = "#FFB300";
  const saffron = "#FF6B00";
  const deepMaroon = "#8B0000";
  const cream = "#FFF3E0";
  const indianBg =
    "linear-gradient(145deg,#1a0800 0%,#2d0c00 30%,#3b0f00 55%,#1e0600 100%)";

  const utilBtn: React.CSSProperties = {
    background: "rgba(255,179,0,0.07)",
    border: "1px solid rgba(255,179,0,0.15)",
    borderRadius: 10,
    color: "rgba(255,243,224,0.65)",
    padding: "6px 7px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  };

  /* ── No track yet ── */
  if (!track) {
    return (
      <div
        style={{
          background: indianBg,
          border: `1px solid rgba(255,179,0,0.2)`,
          borderRadius: 20,
          padding: "16px 24px",
          width: 380,
          color: cream,
          textAlign: "center",
          fontSize: 13,
        }}
      >
        🪔 Loading playlist…
      </div>
    );
  }

  /* ── Minimized chip ── */
  if (isMinimized) {
    return (
      <div style={{ position: "relative", width: 340 }}>
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 20,
            background:
              "radial-gradient(ellipse at center,rgba(255,107,0,0.28) 0%,transparent 70%)",
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: indianBg,
            border: `1px solid rgba(255,179,0,0.25)`,
            borderRadius: 18,
            padding: "10px 14px",
            color: cream,
            boxShadow: `0 0 20px rgba(139,0,0,0.35),inset 0 1px 0 rgba(255,179,0,0.08)`,
          }}
        >
          {/* album art */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${gold}`,
              boxShadow: `0 0 10px rgba(255,179,0,0.3)`,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <Image
              src={track.art}
              alt={track.title}
              fill
              sizes="44px"
              className={`object-cover ${isPlaying ? "spinning" : "spinning spinning-paused"}`}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: cream,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track.title}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,243,224,0.45)", marginTop: 2 }}>
              {track.artist}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={onPlayPauseToggle}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `linear-gradient(135deg,${saffron},${deepMaroon})`,
                border: `1.5px solid ${gold}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: `0 2px 10px rgba(255,107,0,0.4)`,
              }}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            <button onClick={onNext} style={utilBtn} title="Next">
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
            <button onClick={onToggleMinimize} style={utilBtn} title="Expand">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full player ── */
  return (
    <div style={{ position: "relative", maxWidth: 460, width: "100%" }}>
      {/* Mandala / diya atmospheric glow */}
      <div
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: 34,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(255,107,0,0.22) 0%,rgba(139,0,0,0.15) 50%,transparent 80%)",
          filter: "blur(18px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: indianBg,
          border: `1px solid rgba(255,179,0,0.28)`,
          borderRadius: 22,
          padding: "18px 20px 16px",
          color: cream,
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,107,0,0.06),
            inset 0 1px 0 rgba(255,179,0,0.12),
            inset 0 -1px 0 rgba(139,0,0,0.25)
          `,
        }}
      >
        {/* ── Top corner ornaments ── */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
            opacity: 0.25,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M0 18 Q0 0 18 0" stroke={gold} strokeWidth="1.5" fill="none" />
            <circle cx="2" cy="2" r="1.5" fill={gold} />
          </svg>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M18 18 Q18 0 0 0" stroke={gold} strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="2" r="1.5" fill={gold} />
          </svg>
        </div>

        {/* ── Track info row ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Lotus-framed album art */}
          <div style={{ position: "relative", flexShrink: 0, width: 72, height: 72 }}>
            {/* Slow-spinning conic lotus ring */}
            <div
              style={{
                position: "absolute",
                inset: -5,
                borderRadius: "50%",
                background: `conic-gradient(${gold} 0deg,transparent 28deg,${saffron} 56deg,transparent 84deg,#FF9500 112deg,transparent 140deg,${gold} 168deg,transparent 196deg,${saffron} 224deg,transparent 252deg,#FF9500 280deg,transparent 308deg,${gold} 336deg,transparent 360deg)`,
                opacity: 0.55,
                animation: "spin 14s linear infinite",
                animationPlayState: isPlaying ? "running" : "paused",
              }}
            />
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                overflow: "hidden",
                border: `3px solid rgba(255,179,0,0.55)`,
                boxShadow: `0 0 18px rgba(255,107,0,0.4),inset 0 0 6px rgba(139,0,0,0.35)`,
                position: "relative",
              }}
            >
              <Image
                id="albumArt"
                src={track.art}
                alt={track.title}
                fill
                sizes="72px"
                priority
                className={`object-cover ${isPlaying ? "spinning" : "spinning spinning-paused"}`}
              />
            </div>
          </div>

          {/* Title + artist + equalizer */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: cream,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "0.02em",
              }}
            >
              {track.title}
            </h2>
            <p
              style={{
                fontSize: 11,
                color: gold,
                opacity: 0.8,
                margin: "4px 0 0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {track.artist}
            </p>

            {/* Saffron equalizer bars */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 3,
                height: 14,
                marginTop: 9,
              }}
            >
              {[
                { c: saffron, d: "-0.3s" },
                { c: gold, d: "0s" },
                { c: "#FF9500", d: "-0.15s" },
                { c: saffron, d: "-0.4s" },
                { c: gold, d: "-0.1s" },
                { c: "#FF9500", d: "-0.25s" },
              ].map(({ c, d }, i) => (
                <span
                  key={i}
                  style={{
                    width: 3,
                    borderRadius: 99,
                    background: c,
                    height: isPlaying ? undefined : 4,
                    animationDelay: d,
                    display: "block",
                  }}
                  className={isPlaying ? "animate-[bounce_0.7s_ease-in-out_infinite]" : ""}
                />
              ))}
            </div>
          </div>

          {/* Utility buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 2 }}>
            <button onClick={onToggleMinimize} style={utilBtn} title="Minimize">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button onClick={onOpenChat} style={utilBtn} title="Live Chat">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={onOpenTracklist} style={utilBtn} title="Tracklist">
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Ornamental divider ── */}
        <div style={{ margin: "13px 0 10px" }}>
          <OrnamentalDivider />
        </div>

        {/* ── Progress bar ── */}
        <div>
          <div
            onClick={handleProgressBarClick}
            style={{
              position: "relative",
              height: 6,
              background: "rgba(255,179,0,0.1)",
              borderRadius: 99,
              cursor: "pointer",
              border: "1px solid rgba(255,179,0,0.12)",
              overflow: "visible",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: `linear-gradient(90deg,${deepMaroon},${saffron} 60%,${gold})`,
                width: `${progressPercent}%`,
                boxShadow: `0 0 8px rgba(255,107,0,0.45)`,
                position: "relative",
                transition: "width 0.1s linear",
              }}
            >
              {/* thumb */}
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: gold,
                  border: `2.5px solid ${deepMaroon}`,
                  boxShadow: `0 0 7px ${gold}`,
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "rgba(255,243,224,0.4)",
              marginTop: 5,
              padding: "0 2px",
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Controls row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 10,
          }}
        >
          {/* Loop / Shuffle */}
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={onLoopToggle}
              style={{
                ...utilBtn,
                color: isLooping ? gold : "rgba(255,243,224,0.5)",
                background: isLooping ? "rgba(255,179,0,0.13)" : "rgba(255,179,0,0.05)",
                border: isLooping ? `1px solid rgba(255,179,0,0.4)` : `1px solid rgba(255,179,0,0.12)`,
              }}
              title="Loop"
            >
              <Repeat className="w-4 h-4" />
            </button>
            <button
              onClick={onShuffleToggle}
              style={{
                ...utilBtn,
                color: isShuffled ? gold : "rgba(255,243,224,0.5)",
                background: isShuffled ? "rgba(255,179,0,0.13)" : "rgba(255,179,0,0.05)",
                border: isShuffled ? `1px solid rgba(255,179,0,0.4)` : `1px solid rgba(255,179,0,0.12)`,
              }}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>

          {/* Playback */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onPrev}
              style={{
                ...utilBtn,
                borderRadius: "50%",
                width: 34,
                height: 34,
                padding: 0,
                color: "rgba(255,243,224,0.7)",
              }}
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Diya-flame play/pause button */}
            <button
              onClick={onPlayPauseToggle}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 35%,#FF8C00,${deepMaroon} 70%,#5a0000)`,
                border: `2.5px solid ${gold}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: `0 0 0 4px rgba(255,179,0,0.1),0 0 22px rgba(255,107,0,0.45),0 4px 16px rgba(0,0,0,0.5)`,
                transition: "transform 0.15s,box-shadow 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
            >
              {/* inner ring accent */}
              <div
                style={{
                  position: "absolute",
                  inset: 4,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,215,0,0.22)",
                  pointerEvents: "none",
                }}
              />
              {/* decorative lotus watermark behind icon */}
              <div style={{ position: "absolute", opacity: 0.18 }}>
                <LotusIcon size={32} />
              </div>
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current relative" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5 relative" />
              )}
            </button>

            <button
              onClick={onNext}
              style={{
                ...utilBtn,
                borderRadius: "50%",
                width: 34,
                height: 34,
                padding: 0,
                color: "rgba(255,243,224,0.7)",
              }}
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 110 }}>
            <button
              onClick={onMuteToggle}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,243,224,0.6)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
              }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full appearance-none cursor-pointer focus:outline-none"
              style={{
                height: 4,
                borderRadius: 99,
                background: `linear-gradient(to right,${saffron} 0%,${gold} ${isMuted ? 0 : volume}%,rgba(255,179,0,0.12) ${isMuted ? 0 : volume}%,rgba(255,179,0,0.12) 100%)`,
                accentColor: gold,
              }}
            />
          </div>
        </div>

        {/* ── Bottom corner ornaments ── */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
            opacity: 0.2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M0 0 Q0 18 18 18" stroke={gold} strokeWidth="1.5" fill="none" />
            <circle cx="2" cy="16" r="1.5" fill={gold} />
          </svg>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M18 0 Q18 18 0 18" stroke={gold} strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="16" r="1.5" fill={gold} />
          </svg>
        </div>
      </div>
    </div>
  );
}
