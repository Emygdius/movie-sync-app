"use client";

import { useState } from "react";

interface VibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (url: string) => void;
}

// Sample Curated Content
const MOVIE_VIBES = [
  {
    title: "Big Buck Bunny",
    genre: "Animation / Family",
    vibe: "Lighthearted & Fun 🐰",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    title: "Sintel",
    genre: "Fantasy / Adventure",
    vibe: "Epic & Emotional ⚔️",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    title: "Tears of Steel",
    genre: "Sci-Fi / Action",
    vibe: "Futuristic & Thrilling 🤖",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
];

const SPORTS_MATCHES = [
  {
    title: "Live Match Feed (HLS Stream Demo)",
    league: "Premier League / Champions League",
    vibe: "High Intensity Matchday ⚽",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  },
  {
    title: "Ocean Wildlife Live Sports Stream",
    league: "Extreme Sports Broadcast",
    vibe: "Live Action & Drama 🏄‍♂️",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
];

export default function VibeModal({ isOpen, onClose, onSelectMovie }: VibeModalProps) {
  const [activeTab, setActiveTab] = useState<"movies" | "sports">("sports");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ✨ ESync Match & Vibe Selector
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a curated stream or live match feed to broadcast instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab("sports")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "sports"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚽ Live Sports & Feeds
          </button>
          <button
            onClick={() => setActiveTab("movies")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "movies"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🍿 Movie Vibe Picks
          </button>
        </div>

        {/* Content List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {activeTab === "sports"
            ? SPORTS_MATCHES.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/50 p-3.5 rounded-xl flex justify-between items-center transition group"
                >
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{item.league}</span>
                      <span>•</span>
                      <span className="text-emerald-400/80">{item.vibe}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectMovie(item.url);
                      onClose();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Load Stream
                  </button>
                </div>
              ))
            : MOVIE_VIBES.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/50 p-3.5 rounded-xl flex justify-between items-center transition group"
                >
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-rose-400 transition">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{item.genre}</span>
                      <span>•</span>
                      <span className="text-rose-400/80">{item.vibe}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectMovie(item.url);
                      onClose();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Watch Now
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}