"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinOrCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = roomId.trim() || `room-${Math.floor(1000 + Math.random() * 9000)}`;
    router.push(`/room/${targetRoom}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
      <header className="flex justify-between items-center max-w-6xl mx-auto w-full py-4">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
          ESync
        </h1>
        <div className="text-xs text-slate-400 font-medium">
          Live Football & Movie Watch Parties
        </div>
      </header>

      <main className="max-w-xl mx-auto w-full text-center flex flex-col items-center gap-6 my-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs text-indigo-400 font-medium">
          ⚽ Real-time Sports & Movie Sync
        </div>

        <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
          Watch live sports & movies in total sync.
        </h2>

        <p className="text-slate-400 text-sm max-w-md">
          Create a room, stream live matches or movies, and video chat with your crew or partner with zero lag.
        </p>

        <form onSubmit={handleJoinOrCreate} className="w-full max-w-sm flex flex-col sm:flex-row gap-2 mt-2">
          <input
            type="text"
            placeholder="Enter Room Code (e.g., arsenal-vs-chelsea)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap"
          >
            Launch Room 🚀
          </button>
        </form>
      </main>

      <footer className="text-center text-xs text-slate-600 py-4">
        © ESync — Synchronized Watch Parties & WebRTC Video Calls.
      </footer>
    </div>
  );
}