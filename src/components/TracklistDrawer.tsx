"use client";

import React, { useState } from "react";
import { Search, X, Music, Play, BarChart2 } from "lucide-react";
import Image from "next/image";

interface Track {
  videoId: string;
  title: string;
  artist: string;
  art: string;
}

interface TracklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Track[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  isPlaying: boolean;
}

export default function TracklistDrawer({
  isOpen,
  onClose,
  playlist,
  currentTrackIndex,
  onTrackSelect,
  isPlaying,
}: TracklistDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylist = playlist.map((track, originalIndex) => ({
    ...track,
    originalIndex
  })).filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 md:w-96 bg-black/60 backdrop-blur-md border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm tracking-wide flex items-center gap-2">
          <Music className="w-4 h-4 text-red-500" />
          Queue ({playlist.length} tracks)
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition"
          />
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredPlaylist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
            <Search className="w-8 h-8 mb-2 stroke-[1.5]" />
            <p className="text-xs">No tracks found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredPlaylist.map((track) => {
            const isCurrent = track.originalIndex === currentTrackIndex;
            return (
              <button
                key={`${track.videoId}-${track.originalIndex}`}
                onClick={() => onTrackSelect(track.originalIndex)}
                className={`w-full text-left flex items-center gap-3 p-2 rounded-xl transition duration-150 group ${
                  isCurrent
                    ? "bg-gradient-to-r from-red-950/40 via-red-900/30 to-zinc-900/40 border border-red-500/20 text-white"
                    : "hover:bg-white/5 border border-transparent text-zinc-300 hover:text-white"
                }`}
              >
                {/* Thumbnail Art */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-950">
                  <Image
                    src={track.art}
                    alt={track.title}
                    fill
                    sizes="44px"
                    className={`object-cover group-hover:scale-105 transition duration-300 ${
                      isCurrent && isPlaying ? "opacity-70" : ""
                    }`}
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      {isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4 w-4 justify-center">
                          <span className="w-0.5 bg-red-400 rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.4s]"></span>
                          <span className="w-0.5 bg-red-400 rounded-full animate-[bounce_0.8s_infinite]"></span>
                          <span className="w-0.5 bg-red-400 rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.2s]"></span>
                        </div>
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white" />
                      )}
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-xs font-medium truncate ${
                      isCurrent ? "text-red-400" : "text-white"
                    }`}
                  >
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                    {track.artist}
                  </p>
                </div>

                {/* Active Waveform Indicator */}
                {isCurrent && isPlaying && (
                  <div className="flex-shrink-0 text-red-500">
                    <BarChart2 className="w-4 h-4 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
