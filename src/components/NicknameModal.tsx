"use client";

import React, { useState } from "react";
import { MessageSquare, User, X } from "lucide-react";

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function NicknameModal({
  isOpen,
  onClose,
  onConfirm,
}: NicknameModalProps) {
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    
    if (!cleanName) {
      setError("Nickname cannot be empty");
      return;
    }

    if (cleanName.length < 2) {
      setError("Nickname must be at least 2 characters long");
      return;
    }

    if (cleanName.length > 15) {
      setError("Nickname cannot exceed 15 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
      setError("Nickname can only contain letters, numbers, and underscores");
      return;
    }

    setError("");
    onConfirm(cleanName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-sm bg-zinc-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <MessageSquare className="w-4 h-4" />
            </span>
            Join Chat Room
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition p-1 hover:bg-white/5 rounded-full"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Please enter a nickname to join the live listener chat room. You will be able to talk in real-time.
          </p>

          <div>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Choose nickname (e.g. Rahul_99)..."
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError("");
                }}
                maxLength={15}
                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                autoFocus
              />
            </div>
            {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-red-650 hover:bg-red-600 rounded-xl shadow-lg shadow-red-950/30 transition"
            >
              Join Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
