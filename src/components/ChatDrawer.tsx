"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, Reply, CornerDownRight } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
  replyTo?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> list of user nicknames
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  messages: ChatMessage[];
  onSendMessage: (text: string, replyTo?: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onlineCount: number;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  nickname,
  messages,
  onSendMessage,
  onReact,
  onlineCount,
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let textToSend = inputText.trim();
    
    // If we are replying to someone but they are not already mentioned,
    // we can append/prepend the mention, or just pass it as metadata.
    // The user requested: "user can reply in that chat by mentioning"
    // So if a reply target is active, we can ensure it starts with @target
    if (replyTarget && !textToSend.startsWith(`@${replyTarget}`)) {
      textToSend = `@${replyTarget} ${textToSend}`;
    }

    onSendMessage(textToSend, replyTarget || undefined);
    setInputText("");
    setReplyTarget(null);
  };

  const handleReplyClick = (senderName: string) => {
    setReplyTarget(senderName);
    // Focus input and pre-fill mention if not already there
    if (!inputText.startsWith(`@${senderName}`)) {
      setInputText((prev) => `@${senderName} ${prev.replace(/^@\w+\s*/, "")}`);
    }
  };

  // Format time (HH:MM)
  const formatMsgTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-80 md:w-96 bg-black/60 backdrop-blur-md border-r border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-semibold text-white text-sm tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            Live Chat Room
          </h3>
          <span className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {onlineCount} listeners online
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-10">
            <MessageSquare className="w-8 h-8 mb-2 stroke-[1.5] text-zinc-600" />
            <p className="text-xs">No messages yet. Say hello to start the chat!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMentioned = msg.text.includes(`@${nickname}`);
            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${msg.isMe ? "items-end" : "items-start"}`}
              >
                {/* Username Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span
                    className={`text-[10px] font-semibold ${
                      msg.isMe ? "text-red-400" : "text-zinc-300"
                    }`}
                  >
                    {msg.sender}
                  </span>
                  <span className="text-[8px] text-zinc-500">{formatMsgTime(msg.timestamp)}</span>
                </div>

                {/* Message Bubble Container */}
                <div className="flex items-center gap-2 max-w-[85%] relative group/bubble">
                  {/* Quick Reactions bar (on hover) */}
                  <div className={`absolute bottom-full mb-1 z-10 flex items-center gap-1.5 bg-zinc-900/95 border border-white/10 rounded-full px-2 py-1 shadow-2xl opacity-0 group-hover/bubble:opacity-100 transition duration-150 ${msg.isMe ? 'right-0' : 'left-0'}`}>
                    {["👍", "❤️", "😂", "🔥", "😮"].map((emoji) => {
                      const users = msg.reactions?.[emoji] || [];
                      const hasReacted = users.includes(nickname);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReact(msg.id, emoji)}
                          className={`text-xs hover:scale-125 transition p-0.5 rounded ${hasReacted ? 'bg-white/15' : ''}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col">
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs break-words shadow-md border ${
                        msg.isMe
                          ? "bg-red-950/40 border-red-500/20 text-white rounded-tr-none"
                          : isMentioned
                          ? "bg-yellow-950/40 border-yellow-500/30 text-yellow-100 rounded-tl-none animate-pulse-slow"
                          : "bg-white/5 border-white/5 text-zinc-100 rounded-tl-none"
                      }`}
                    >
                      {/* Render Reply Target Header inside bubble if exists */}
                      {msg.replyTo && (
                        <div className="flex items-center gap-1 text-[9px] text-zinc-400 mb-1 border-b border-white/5 pb-1">
                          <CornerDownRight className="w-2.5 h-2.5" />
                          <span>replied to @{msg.replyTo}</span>
                        </div>
                      )}
                      
                      {/* Parse mentions and highlight them in the text */}
                      {msg.text.split(/(@\w+)/g).map((part, i) => {
                        if (part.startsWith("@")) {
                          return (
                            <span key={i} className="text-red-400 font-medium">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </div>

                    {/* Reactions capsules */}
                    {msg.reactions && Object.entries(msg.reactions).some(([_, users]) => users.length > 0) && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => {
                          if (users.length === 0) return null;
                          const hasReacted = users.includes(nickname);
                          return (
                            <button
                              key={emoji}
                              onClick={() => onReact(msg.id, emoji)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] transition ${
                                hasReacted
                                  ? "bg-red-500/25 border-red-500/35 text-red-200"
                                  : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/10"
                              }`}
                              title={users.join(", ")}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Reply Button on Hover */}
                  {!msg.isMe && (
                    <button
                      onClick={() => handleReplyClick(msg.sender)}
                      className="opacity-0 group-hover/bubble:opacity-100 transition p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white"
                      title={`Reply to ${msg.sender}`}
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Target Header banner */}
      {replyTarget && (
        <div className="bg-red-950/20 border-t border-white/5 px-4 py-1.5 flex items-center justify-between text-[10px] text-red-400">
          <span className="flex items-center gap-1">
            <Reply className="w-3 h-3" />
            Replying to @{replyTarget}
          </span>
          <button
            onClick={() => {
              setReplyTarget(null);
              // Clear mention if it is empty except for the mention
              if (inputText.trim() === `@${replyTarget}`) {
                setInputText("");
              }
            }}
            className="hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2 items-center bg-zinc-950/40">
        <input
          type="text"
          placeholder={`Chatting as ${nickname}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-zinc-950/80 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition"
        />
        <button
          type="submit"
          className="p-2 bg-red-650 hover:bg-red-600 rounded-xl text-white shadow-lg transition duration-150 disabled:opacity-50"
          disabled={!inputText.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
