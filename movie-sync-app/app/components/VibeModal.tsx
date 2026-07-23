"use client";

import { useState } from "react";

interface VibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (url: string) => void;
}

export default function VibeModal({ isOpen, onClose, onSelectMovie }: VibeModalProps) {
  const [activeTab, setActiveTab] = useState<"movies" | "sports">("movies");
  
  // OMDb Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/movies?s=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.Search) {
        setSearchResults(data.Search);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ✨ ESync Media Search
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Search live broadcasts or catalog titles.
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
            onClick={() => setActiveTab("movies")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "movies"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🍿 Movie Catalog
          </button>
          <button
            onClick={() => setActiveTab("sports")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "sports"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚽ Live Sports Feeds
          </button>
        </div>

        {/* OMDb Live Search Bar */}
        {activeTab === "movies" && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search movie catalog (e.g. Inception, Batman)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition"
            >
              {loading ? "..." : "Search"}
            </button>
          </form>
        )}

        {/* OMDb Search Results */}
        {activeTab === "movies" && searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              🔍 Catalog Results
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {searchResults.map((item) => (
                <div
                  key={item.imdbID}
                  className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2.5 flex justify-between items-center transition"
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={item.Poster !== "N/A" ? item.Poster : "https://via.placeholder.com/50"}
                      alt={item.Title}
                      className="w-10 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {item.Title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Year: {item.Year} • Type: {item.Type}
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-md">
                    Metadata Only
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "sports" && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-400">
            ⚽ Live match channels update automatically when active feeds go live.
          </div>
        )}
      </div>
    </div>
  );
}