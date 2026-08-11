"use client";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

import React, { useState, useEffect, useRef } from "react";
import PlayerDashboard from "@/components/PlayerDashboard";
import TracklistDrawer from "@/components/TracklistDrawer";
import ChatDrawer, { ChatMessage } from "@/components/ChatDrawer";
import NicknameModal from "@/components/NicknameModal";
import { AlertCircle, CheckCircle, Info, Clock, MessageSquare, X } from "lucide-react";

interface Track {
  videoId: string;
  title: string;
  artist: string;
  art: string;
}

interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

const FALLBACK_PLAYLIST: Track[] = [
  // {
  //   videoId: "Xi6BjmipH58",
  //   title: "Ram Jaane Title Track |  Udit Narayan, Sonu Nigam, Alka Yagnik | Shah Rukh Khan, Juhi Chawla",
  //   artist: "Red Chillies Entertainment",
  //   art: "https://i.ytimg.com/vi/Xi6BjmipH58/hqdefault.jpg",
  // },
  // {
  //   videoId: "caEfgyFv4SM",
  //   title: "Chhote Chhote Bhaiyon Ke Bade Bhaiyya - Hum Saath Saath Hain - Bollywood Wedding Song",
  //   artist: "Rajshri",
  //   art: "https://i.ytimg.com/vi/caEfgyFv4SM/hqdefault.jpg",
  // },
  // {
  //   videoId: "8mweiZlvxsE",
  //   title: "Dil Ki Tanhai Ko | Kumar Sanu | Chaahat | Shah Rukh Khan, Ramya Krishnan, Pooja Bhatt",
  //   artist: "Red Chillies Entertainment",
  //   art: "https://i.ytimg.com/vi/8mweiZlvxsE/hqdefault.jpg",
  // },
  // {
  //   videoId: "U0qBRoeQa-g",
  //   title: "Tu Pyar Hai Kisi Aur Ka (Full Song):Aamir K, Pooja B| Anuradha P, Kumar Sanu| Dil Hai Ke Manta Nahin",
  //   artist: "T-Series",
  //   art: "https://i.ytimg.com/vi/U0qBRoeQa-g/hqdefault.jpg",
  // },
  // {
  //   videoId: "x_elT6zkqN0",
  //   title: "\"Oh Oh Jane Jaana\" Salman Khan Full Song | Pyaar Kiya Toh Darna Kya",
  //   artist: "T-Series",
  //   art: "https://i.ytimg.com/vi/x_elT6zkqN0/hqdefault.jpg",
  // },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>(FALLBACK_PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Modal / Drawer Toggles
  const [isTracklistOpen, setIsTracklistOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  // Chat States
  const [nickname, setNickname] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeMentionNotification, setActiveMentionNotification] = useState<{
    sender: string;
    text: string;
  } | null>(null);

  // Time, Date & WebSocket state
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  // Configuration
  const [apiKey, setApiKey] = useState("");
  const [playlistId, setPlaylistId] = useState("PLCQNxlKDRUXQ");

  // Notifications
  const [notification, setNotification] = useState<Notification | null>(null);

  const playerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const nicknameRef = useRef(nickname);
  const isChatOpenRef = useRef(isChatOpen);

  // ── Analytics tracking refs ──
  const sessionIdRef = useRef<string>("");
  const songsPlayedRef = useRef(0);
  const chatMsgCountRef = useRef(0);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Sync index ref for event handlers
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Sync nickname ref for WebSocket events
  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  // Handle mounting state
  useEffect(() => {
    setIsMounted(true);

    // Load configs from local storage
    const storedApiKey = localStorage.getItem("yt_api_key") || "";
    const storedPlaylistId = localStorage.getItem("yt_playlist_id") || "PLCQNxlKDRUXQ";
    const storedVolume = localStorage.getItem("player_volume");
    const storedNickname = localStorage.getItem("chat_nickname") || "";

    setApiKey(storedApiKey);
    setPlaylistId(storedPlaylistId);
    setNickname(storedNickname);
    if (storedVolume) setVolume(Number(storedVolume));

    // Load chat history from sessionStorage
    const storedMessages = sessionStorage.getItem("chat_messages");
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        const mapped = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setChatMessages(mapped);
      } catch (e) {
        console.warn("Failed to load chat history:", e);
      }
    }

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // ── Analytics: fire visit on mount, heartbeat ping every 30s ──
  useEffect(() => {
    // Generate or reuse a sessionId stored in localStorage
    let sid = localStorage.getItem("_deshbhakt_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("_deshbhakt_sid", sid);
    }
    sessionIdRef.current = sid;
    const nick = localStorage.getItem("chat_nickname") || "Anonymous";

    // Fire initial visit
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sid,
        nickname: nick,
        referrer: document.referrer || "direct",
      }),
    }).catch(() => {});

    // Heartbeat every 30s
    const pingInterval = setInterval(() => {
      fetch("/api/track/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          nickname: nicknameRef.current || localStorage.getItem("chat_nickname") || "Anonymous",
          songsPlayed: songsPlayedRef.current,
          chatMessages: chatMsgCountRef.current,
        }),
      }).catch(() => {});
      // Reset delta counters after each ping
      songsPlayedRef.current = 0;
      chatMsgCountRef.current = 0;
    }, 30_000);

    return () => clearInterval(pingInterval);
  }, []);

  // Fetch playlist whenever API settings change (after component mounted)
  useEffect(() => {
    if (!isMounted) return;

    const loadPlaylistData = async () => {
      // If we have an API key, we use the official YouTube Data API.
      // If NOT, we call our server-side API route which parses the playlist page dynamically!
      if (apiKey) {
        showNotification("Fetching YouTube playlist via API Key...", "info");
        try {
          const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Official API request failed");

          const data = await res.json();
          if (data.error) throw new Error(data.error.message);

          const fetchedTracks: Track[] = [];
          data.items.forEach((item: any) => {
            const snippet = item.snippet;
            if (!snippet || snippet.title === "Deleted video" || snippet.title === "Private video") return;

            fetchedTracks.push({
              videoId: snippet.resourceId.videoId,
              title: snippet.title,
              artist: snippet.videoOwnerChannelTitle || snippet.channelTitle || "YouTube Creator",
              art: snippet.thumbnails?.high?.url ||
                snippet.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${snippet.resourceId.videoId}/hqdefault.jpg`,
            });
          });

          if (fetchedTracks.length > 0) {
            setPlaylist(fetchedTracks);
            setCurrentIndex(0);
            showNotification(`Successfully loaded ${fetchedTracks.length} tracks!`, "success");
            return;
          }
        } catch (err) {
          console.warn("Official API fetch failed, trying scraper API...", err);
        }
      }

      // Scraper API route (no API key required, runs serverside)
      showNotification("Fetching playlist dynamically from YouTube...", "info");
      try {
        const res = await fetch(`/api/playlist?listId=${playlistId}`);
        if (!res.ok) throw new Error("Scraper API returned error status");
        const data = await res.json();

        if (data.playlist && data.playlist.length > 0) {
          setPlaylist(data.playlist);
          setCurrentIndex(0);
          showNotification(`Successfully loaded ${data.playlist.length} tracks dynamically!`, "success");
        } else {
          throw new Error("Scraper API returned no tracks");
        }
      } catch (err) {
        console.error("Dynamic playlist load failed, using hardcoded fallback:", err);
        showNotification("Failed to fetch dynamically. Loading backup list.", "error");
        setPlaylist(FALLBACK_PLAYLIST);
        setCurrentIndex(0);
      }
    };

    loadPlaylistData();
  }, [apiKey, playlistId, isMounted]);

  // Handle YouTube Player Initialization & Lifecycle
  useEffect(() => {
    if (!isMounted || !playlist.length) return;

    const initPlayer = () => {
      if (playerRef.current) {
        // Player exists, load/cue first video of new playlist if methods are ready
        if (typeof playerRef.current.cueVideoById === "function") {
          playerRef.current.cueVideoById(playlist[currentIndex].videoId);
        }
        return;
      }

      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player("youtube-player-element", {
        width: "1",
        height: "1",
        videoId: playlist[currentIndex].videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            setDuration(event.target.getDuration());
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Refresh duration on every PLAYING event — loadVideoById skips CUED
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
            } else {
              setIsPlaying(false);
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              handleNextAuto();
            }

            if (event.data === window.YT.PlayerState.CUED) {
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }
  }, [playlist, isMounted]);

  // Track state progress loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && isPlayerReady && playerRef.current) {
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          setCurrentTime(playerRef.current.getCurrentTime());
          // Keep duration in sync — getDuration() may return 0 briefly while buffering
          const liveDur = playerRef.current.getDuration?.();
          if (liveDur > 0) setDuration(liveDur);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPlayerReady]);

  // Save volume config
  useEffect(() => {
    localStorage.setItem("player_volume", String(volume));
  }, [volume]);

  // Save chat history to sessionStorage
  useEffect(() => {
    if (isMounted) {
      sessionStorage.setItem("chat_messages", JSON.stringify(chatMessages));
    }
  }, [chatMessages, isMounted]);

  // Sync background video play state with player playback
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.warn("Background video playback failed to start:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Clock Date & Time sync
  useEffect(() => {
    setDateTime(new Date());
    const clockTimer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // WebSocket Live user counter & Chat connection (using ntfy.sh as a free broadcast broker)
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSocket = () => {
      try {
        const chatTopic = `rajutruckdriver_chat_${playlistId}`;
        const ws = new WebSocket(`wss://ntfy.sh/${chatTopic}/ws`);
        socket = ws;
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("Live WebSocket chat connection established via ntfy.sh.");
        };

        ws.onmessage = (event) => {
          try {
            const ntfyData = JSON.parse(event.data);
            if (ntfyData.event === "message") {
              const data = JSON.parse(ntfyData.message);

              if (data && data.type === "chat") {
                const isMe = data.sender === nicknameRef.current;

                // Show notification if user is mentioned and chat drawer is closed
                const isMentioned = data.text.includes(`@${nicknameRef.current}`);
                if (!isMe && isMentioned && !isChatOpenRef.current) {
                  setActiveMentionNotification({
                    sender: data.sender,
                    text: data.text,
                  });

                  // Auto-close notification after 6 seconds
                  setTimeout(() => {
                    setActiveMentionNotification((prev) => {
                      if (prev?.sender === data.sender && prev?.text === data.text) {
                        return null;
                      }
                      return prev;
                    });
                  }, 6000);
                }

                const newMsg: ChatMessage = {
                  id: data.id,
                  sender: data.sender,
                  text: data.text,
                  timestamp: new Date(data.timestamp),
                  isMe: isMe,
                  replyTo: data.replyTo,
                  reactions: data.reactions || {},
                };

                setChatMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                return;
              }

              if (data && data.type === "reaction") {
                setChatMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id !== data.messageId) return msg;
                    const reactions = { ...(msg.reactions || {}) };
                    const users = [...(reactions[data.emoji] || [])];
                    const userIdx = users.indexOf(data.reactor);
                    if (userIdx > -1) {
                      users.splice(userIdx, 1);
                    } else {
                      users.push(data.reactor);
                    }
                    reactions[data.emoji] = users;
                    return { ...msg, reactions };
                  })
                );
                return;
              }
            }
          } catch (e) { }
        };

        ws.onerror = (err) => {
          console.warn("WebSocket experienced error:", err);
        };

        ws.onclose = () => {
          console.log("WebSocket connection lost. Reconnecting in 5s...");
          reconnectTimeout = setTimeout(connectSocket, 5000);
        };
      } catch (e) {
        console.warn("Could not instantiate WebSocket connection:", e);
      }
    };

    connectSocket();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [playlistId]);

  // ── Real-time presence counter via ntfy.sh WebSocket ──
  useEffect(() => {
    const PRESENCE_TOPIC = "deshbhakt_presence_live_v1";
    let presenceSocket: WebSocket | null = null;
    let presenceReconnect: NodeJS.Timeout;

    const connectPresence = () => {
      try {
        presenceSocket = new WebSocket(`wss://ntfy.sh/${PRESENCE_TOPIC}/ws`);

        presenceSocket.onmessage = (event) => {
          try {
            const ntfyData = JSON.parse(event.data);
            if (ntfyData.event === "message") {
              const data = JSON.parse(ntfyData.message);
              if (data?.type === "presence" && typeof data.count === "number") {
                setOnlineCount(data.count);
              }
            }
          } catch (_) {}
        };

        presenceSocket.onclose = () => {
          presenceReconnect = setTimeout(connectPresence, 5000);
        };

        presenceSocket.onerror = () => {
          presenceSocket?.close();
        };
      } catch (e) {
        console.warn("Presence WebSocket failed:", e);
      }
    };

    connectPresence();

    return () => {
      presenceSocket?.close();
      clearTimeout(presenceReconnect);
    };
  }, []);



  const handleOpenChat = () => {
    if (!nickname) {
      setIsNicknameModalOpen(true);
    } else {
      setIsChatOpen(true);
    }
  };

  const handleConfirmNickname = (name: string) => {
    setNickname(name);
    localStorage.setItem("chat_nickname", name);
    setIsChatOpen(true);
    showNotification(`Joined chat room as ${name}!`, "success");
  };

  const handleSendMessage = async (text: string, replyTo?: string) => {
    const msgPayload = {
      type: "chat",
      id: Math.random().toString(36).substring(2, 9),
      sender: nickname,
      text: text,
      timestamp: new Date().toISOString(),
      replyTo: replyTo,
      reactions: {},
    };

    try {
      const chatTopic = `rajutruckdriver_chat_${playlistId}`;
      await fetch(`https://ntfy.sh/${chatTopic}`, {
        method: "POST",
        body: JSON.stringify(msgPayload),
      });
      // Track chat message sent
      chatMsgCountRef.current += 1;
    } catch (e) {
      console.error("Failed to publish message:", e);
      showNotification("Failed to send message", "error");
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    const rxPayload = {
      type: "reaction",
      messageId: messageId,
      emoji: emoji,
      reactor: nickname,
    };

    try {
      const chatTopic = `rajutruckdriver_chat_${playlistId}`;
      await fetch(`https://ntfy.sh/${chatTopic}`, {
        method: "POST",
        body: JSON.stringify(rxPayload),
      });
    } catch (e) {
      console.error("Failed to publish reaction:", e);
    }
  };

  // Format date time helper
  const formattedDateTime = dateTime
    ? dateTime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " • " +
    dateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "";

  // Show status notification
  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Cue/Load song helper
  const loadSong = (index: number, autoPlayAfter = true) => {
    if (!isPlayerReady || !playerRef.current || typeof playerRef.current.cueVideoById !== "function" || typeof playerRef.current.loadVideoById !== "function") return;

    // Circular playlist boundary
    const newIndex = (index + playlist.length) % playlist.length;
    setCurrentIndex(newIndex);
    setCurrentTime(0);

    // Track song played
    songsPlayedRef.current += 1;

    if (autoPlayAfter) {
      playerRef.current.loadVideoById(playlist[newIndex].videoId);
      setIsPlaying(true);
    } else {
      playerRef.current.cueVideoById(playlist[newIndex].videoId);
      setIsPlaying(false);
    }
  };

  // Next song when manual Skip clicked
  const handleNext = () => {
    if (isShuffled) {
      const randIndex = Math.floor(Math.random() * playlist.length);
      loadSong(randIndex);
    } else {
      loadSong(currentIndex + 1);
    }
  };

  // Next song when song finishes (Auto Next)
  const handleNextAuto = () => {
    // If loop is enabled, reload current song
    if (isLooping) {
      loadSong(currentIndexRef.current);
    } else {
      if (isShuffled) {
        const randIndex = Math.floor(Math.random() * playlist.length);
        loadSong(randIndex);
      } else {
        loadSong(currentIndexRef.current + 1);
      }
    }
  };

  const handlePrev = () => {
    if (isShuffled) {
      const randIndex = Math.floor(Math.random() * playlist.length);
      loadSong(randIndex);
    } else {
      loadSong(currentIndex - 1);
    }
  };

  const handlePlayPauseToggle = () => {
    if (!isPlayerReady || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (percent: number) => {
    if (!isPlayerReady || !playerRef.current) return;
    const seekTime = duration * percent;
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isPlayerReady && playerRef.current) {
      playerRef.current.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    }
  };

  const handleMuteToggle = () => {
    if (!isPlayerReady || !playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSaveSettings = (newApiKey: string, newPlaylistId: string) => {
    localStorage.setItem("yt_api_key", newApiKey);
    localStorage.setItem("yt_playlist_id", newPlaylistId);
    setApiKey(newApiKey);
    setPlaylistId(newPlaylistId);
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-zinc-400">Loading Audio Experience...</p>
        </div>
      </div>
    );
  }

  const currentTrack = playlist[currentIndex] || null;

  return (
    <main className="relative h-screen w-screen flex items-end justify-center pb-12 overflow-hidden select-none">

      {/* Header Info Overlay */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 flex items-center justify-between z-30 pointer-events-none select-none">
        {/* Left: Time and Date */}
        <div className="pointer-events-auto bg-zinc-950/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white text-xs font-medium tracking-wide flex items-center gap-2 shadow-lg">
          <Clock className="w-3.5 h-3.5 text-red-400" />
          <span>{formattedDateTime}</span>
        </div>

        {/* Center: Live Users Online */}
        <div className="pointer-events-auto bg-zinc-950/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white text-xs font-medium tracking-wide flex items-center gap-2 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{onlineCount} Listening Live</span>
        </div>

        {/* Right: Playlist Link */}
        <a
          href="https://youtube.com/playlist?list=PLCQNxlKDRUXQ&si=lgXQf8SdsX_3VVfy"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto bg-zinc-950/50 hover:bg-zinc-900/70 hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-md border border-white/10 hover:border-red-500/40 rounded-full px-4 py-2 text-white text-xs font-medium tracking-wide flex items-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span>Open Playlist</span>
        </a>
      </header>

      {/* Background Video */}
      <video
        ref={videoRef}
        src="/bg.mp4"
        muted
        loop
        playsInline
      />

      {/* Decorative Blur Layers */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-red-650/10 rounded-full blur-[100px] animate-[pulse_6s_infinite_alternate]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[90px] animate-[pulse_8s_infinite_alternate_2s]" />
      </div>

      {/* Hidden YouTube IFrame API Element */}
      <div id="youtube-player-element" className="absolute pointer-events-none opacity-0 -z-50" />

      {/* Toast Notification Container */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-zinc-900/90 border border-white/10 rounded-full px-4 py-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
          {notification.type === "success" && <CheckCircle className="w-4 h-4 text-green-400" />}
          {notification.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
          {notification.type === "info" && <Info className="w-4 h-4 text-blue-400" />}
          <span className="text-xs font-medium text-zinc-200">{notification.message}</span>
        </div>
      )}
      {/* Floating Mention Bubble Notification */}
      {activeMentionNotification && (
        <div
          onClick={() => {
            setIsChatOpen(true);
            setActiveMentionNotification(null);
          }}
          className="fixed top-20 right-6 z-50 pointer-events-auto w-72 bg-zinc-950/90 hover:bg-zinc-900/90 border border-red-500/30 hover:border-red-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-md cursor-pointer animate-in slide-in-from-right duration-350 hover:scale-102 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 mt-0.5 animate-pulse">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                New Mention
              </p>
              <p className="text-xs font-bold text-white mt-0.5 truncate">
                @{activeMentionNotification.sender} mentioned you
              </p>
              <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2 leading-relaxed italic">
                "{activeMentionNotification.text}"
              </p>
              <p className="text-[9px] text-zinc-500 mt-2 font-medium">
                Click to open chat
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent opening chat
                setActiveMentionNotification(null);
              }}
              className="text-zinc-500 hover:text-white transition p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Main Floating Audio Dashboard */}
      <div className="z-10 w-full flex justify-center">
        <PlayerDashboard
          track={currentTrack}
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          volume={volume}
          isMuted={isMuted}
          isLooping={isLooping}
          isShuffled={isShuffled}
          onPlayPauseToggle={handlePlayPauseToggle}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onLoopToggle={() => setIsLooping(!isLooping)}
          onShuffleToggle={() => setIsShuffled(!isShuffled)}
          onOpenTracklist={() => setIsTracklistOpen(true)}
          onOpenChat={handleOpenChat}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
      </div>

      {/* Slide-out Tracklist Sidebar (Right) */}
      <TracklistDrawer
        isOpen={isTracklistOpen}
        onClose={() => setIsTracklistOpen(false)}
        playlist={playlist}
        currentTrackIndex={currentIndex}
        onTrackSelect={(index) => loadSong(index)}
        isPlaying={isPlaying}
      />

      {/* Slide-out Chat Sidebar (Left) */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        nickname={nickname}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        onReact={handleReact}
        onlineCount={onlineCount}
      />

      {/* Nickname Dialog Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        onConfirm={handleConfirmNickname}
      />

    </main>
  );
}
