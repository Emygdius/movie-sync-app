"use client";

import { useState } from "react";

interface MomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerMoment: (message: string, style: "love" | "celebrate") => void;
}

export default function MomentModal({
  isOpen,
  onClose,
  onTriggerMoment,
}: MomentModalProps) {
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState<"love" | "celebrate">("love");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              💖 Broadcast Special Moment
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pause the match or movie and trigger a full-screen animated overlay across all guest screens!
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Style Switcher */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStyle("love")}
            className={`p-3 rounded-xl border text-center font-semibold text-xs transition ${
              style === "love"
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            ❤️ Romantic Note
          </button>

          <button
            type="button"
            onClick={() => setStyle("celebrate")}
            className={`p-3 rounded-xl border text-center font-semibold text-xs transition ${
              style === "celebrate"
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            🎉 Match Celebration
          </button>
        </div>

        {/* Custom Text Area */}
        <textarea
          rows={3}
          placeholder={
            style === "love"
              ? "Type a romantic message or note..."
              : "GOAL! What an incredible match moment! ⚽🔥"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (message.trim()) {
                onTriggerMoment(message, style);
                setMessage("");
                onClose();
              }
            }}
            className="flex-1 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 text-white text-xs py-2.5 rounded-xl font-bold transition"
          >
            Send Interruption ✨
          </button>
        </div>
      </div>
    </div>
  );
}