"use client";

import { useState } from "react";

interface Movie {
  title: string;
  url: string;
  desc: string;
}

interface VibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (url: string) => void;
}

const VIBE_CATEGORIES: Record<
  string,
  { label: string; icon: string; movies: Movie[] }
> = {
  lover: {
    label: "Lover / Date Night",
    icon: "❤️",
    movies: [
      {
        title: "Tears of Steel (Sci-Fi Romance)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        desc: "A futuristic drama filled with passion and visual spectacle.",
      },
      {
        title: "Sintel (Emotional Fantasy)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        desc: "An emotional journey of devotion, dragon bonds, and discovery.",
      },
    ],
  },
  crush: {
    label: "Secret Crush",
    icon: "✨",
    movies: [
      {
        title: "Big Buck Bunny (Fun & Lighthearted)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        desc: "Charming, hilarious, and easygoing for a comfortable watch.",
      },
    ],
  },
  friends: {
    label: "Best Friends",
    icon: "🥳",
    movies: [
      {
        title: "Elephants Dream (Mind-Bending)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        desc: "Surreal visual experience perfect for group commentary.",
      },
    ],
  },
  colleagues: {
    label: "Colleagues / Chill",
    icon: "💼",
    movies: [
      {
        title: "For Bigger Blazes (Action Demo)",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        desc: "Quick action stream clip ideal for casual group testing.",
      },
    ],
  },
};

export default function VibeModal({
  isOpen,
  onClose,
  onSelectMovie,
}: VibeModalProps) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🍿 Vibe Matcher
            </h2>
            <p className="text-xs text-slate-400">
              Who are you watching with today? Select a vibe to get handpicked movies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 rounded-lg bg-slate-800/50"
          >
            ✕
          </button>
        </div>

        {/* Vibe Selection Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(VIBE_CATEGORIES).map(([key, vibe]) => (
            <button
              key={key}
              onClick={() => setSelectedVibe(key)}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                selectedVibe === key
                  ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span className="text-2xl">{vibe.icon}</span>
              <span className="text-xs font-semibold">{vibe.label}</span>
            </button>
          ))}
        </div>

        {/* Recommendation Results */}
        {selectedVibe && (
          <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Suggestions for {VIBE_CATEGORIES[selectedVibe].label}:
            </h3>
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {VIBE_CATEGORIES[selectedVibe].movies.map((movie, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex justify-between items-center hover:border-indigo-500/50 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{movie.title}</p>
                    <p className="text-[11px] text-slate-400">{movie.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      onSelectMovie(movie.url);
                      onClose();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap"
                  >
                    Load Movie
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}