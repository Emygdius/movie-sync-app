"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  const [roomInput, setRoomInput] = useState("");
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  const handleLaunchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      const formattedRoom = roomInput.trim().toLowerCase().replace(/\s+/g, "-");
      router.push(`/room/${formattedRoom}`);
    } else {
      const randomId = Math.random().toString(36).substring(2, 8);
      router.push(`/room/room-${randomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Unified ESync Navbar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex justify-between items-center bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍿</span>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent tracking-tight">
            ESync
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            ⚽ Live Football & 🍿 Movie Sync
          </span>

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">
                Welcome, {user.firstName || "Viewer"}!
              </span>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl flex flex-col items-center gap-6 z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="animate-pulse">⚽</span> Real-time Sports & Movie Sync
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Watch live sports & movies in <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">total sync.</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Create a room, stream live matches or movies, and video chat with your crew or partner with zero lag.
          </p>

          {/* Room Launcher Form */}
          <form onSubmit={handleLaunchRoom} className="w-full max-w-md flex flex-col sm:flex-row gap-2.5 mt-2">
            <input
              type="text"
              placeholder="Enter Room Code (e.g. arsenal-vs-chelsea)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Launch Room</span> 🚀
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        ESync Watch Party Platform • Built for synchronized streaming
      </footer>
    </div>
  );
}