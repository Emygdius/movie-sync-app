"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import * as Ably from "ably";
import VibeModal from "../components/VibeModal";

export default function RoomPage() {
  const { user, isLoaded } = useUser();

  // Room Mode State: "movie" or "sports"
  const [roomMode, setRoomMode] = useState<"movie" | "sports">("movie");
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  // Video & Chat State
  const [videoUrl, setVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [inputUrl, setInputUrl] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "System: Welcome to your private ESync Watch Room! ⚽🍿",
  ]);
  const [chatInput, setChatInput] = useState("");

  // Vibe / Match Modal State
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);

  // Host Permission Logic
  const [hostId, setHostId] = useState<string | null>(null);
  const isHost = isLoaded && user?.id === hostId;

  // Real-time Refs
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isRemoteAction = useRef(false);

  // Set initial host
  useEffect(() => {
    if (user && !hostId) {
      setHostId(user.id);
    }
  }, [user, hostId]);

  // Connect to Ably WebSocket Channel
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/ably" });
    const channel = client.channels.get("esync-room-1");
    channelRef.current = channel;

    channel.subscribe("sync-video", (msg) => {
      const { type, url, time, mode } = msg.data;
      isRemoteAction.current = true;

      if (type === "CHANGE_URL") {
        setVideoUrl(url);
      } else if (type === "CHANGE_MODE") {
        setRoomMode(mode);
      } else if (type === "PLAY" && videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.play();
      } else if (type === "PAUSE" && videoRef.current) {
        videoRef.current.currentTime = time;
        videoRef.current.pause();
      }

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 300);
    });

    channel.subscribe("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg.data]);
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, []);

  // Broadcast handlers
  const handlePlay = () => {
    if (isRemoteAction.current || !videoRef.current) return;
    channelRef.current?.publish("sync-video", {
      type: "PLAY",
      time: videoRef.current.currentTime,
    });
  };

  const handlePause = () => {
    if (isRemoteAction.current || !videoRef.current) return;
    channelRef.current?.publish("sync-video", {
      type: "PAUSE",
      time: videoRef.current.currentTime,
    });
  };

  const handleLoadVideo = (urlToLoad: string) => {
    if (!isHost) return;
    setVideoUrl(urlToLoad);
    channelRef.current?.publish("sync-video", {
      type: "CHANGE_URL",
      url: urlToLoad,
    });
  };

  const handleSelectMode = (mode: "movie" | "sports") => {
    if (!isHost) return;
    setRoomMode(mode);
    setIsModeSelectorOpen(false);

    // Broadcast mode change to guests
    channelRef.current?.publish("sync-video", {
      type: "CHANGE_MODE",
      mode: mode,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      handleLoadVideo(inputUrl);
      setInputUrl("");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const senderName = user?.firstName || "Guest";
      const fullMsg = `${senderName}: ${chatInput}`;
      channelRef.current?.publish("chat-message", fullMsg);
      setChatInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            ESync
          </h1>

          {/* Mode Switcher Badge */}
          <button
            onClick={() => isHost && setIsModeSelectorOpen(true)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition flex items-center gap-1 ${
              roomMode === "sports"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
          >
            {roomMode === "sports" ? "⚽ Live Football Mode" : "🍿 Movie Night Mode"}
            {isHost && <span className="text-[10px] opacity-70">⚙️</span>}
          </button>

          <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-medium">
            {isHost ? "👑 Host" : "🍿 Guest"}
          </span>
        </div>

        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
          ● Connected
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        {/* Left Area: Main Video Stream & Floating Webcams */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onPlay={handlePlay}
              onPause={handlePause}
              className="w-full h-full object-contain"
            />

            {/* Floating Webcam Overlay Placeholders */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
              <div className="w-32 aspect-video bg-slate-900/90 rounded-lg border border-white/20 flex items-center justify-center text-[10px] text-slate-300 backdrop-blur shadow-lg">
                Partner Feed 📹
              </div>
              <div className="w-32 aspect-video bg-slate-900/90 rounded-lg border border-white/20 flex items-center justify-center text-[10px] text-slate-300 backdrop-blur shadow-lg">
                Your Feed 📹
              </div>
            </div>
          </div>

          {/* Host Controls */}
          {isHost ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleFormSubmit} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    roomMode === "sports"
                      ? "Paste direct stream URL or HLS link (.m3u8)..."
                      : "Paste direct MP4 or video stream link..."
                  }
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {roomMode === "sports" ? "Change Match" : "Change Movie"}
                </button>
              </form>

              <button
                onClick={() => setIsVibeModalOpen(true)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                ✨ {roomMode === "sports" ? "Match Matcher" : "Vibe Matcher"}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center text-xs text-slate-400">
              🔒 Only the host can change the {roomMode === "sports" ? "match" : "movie"} stream. Sit back and enjoy!
            </div>
          )}
        </div>

        {/* Right Area: Interactive Live Chat */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col h-[500px] lg:h-auto">
          <div className="p-3 border-b border-slate-800 font-semibold text-slate-300 text-sm flex justify-between items-center">
            <span>Live Chat</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {roomMode} Sync
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm text-slate-300">
            {messages.map((msg, index) => {
              const isUserMsg = msg.startsWith(`${user?.firstName || "You"}:`);
              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-xs ${
                    isUserMsg
                      ? "bg-indigo-600/30 border border-indigo-500/30 self-end text-right"
                      : "bg-slate-800/50"
                  }`}
                >
                  {msg}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-xs px-3 py-2 rounded-lg font-semibold hover:bg-indigo-500"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Mode Selection Modal for Host */}
      {isModeSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ⚡ Choose ESync Mode
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                What are you hosting in this room today?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSelectMode("movie")}
                className={`p-4 rounded-xl border text-left flex items-center gap-4 transition ${
                  roomMode === "movie"
                    ? "bg-indigo-600/20 border-indigo-500 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span className="text-3xl">🍿</span>
                <div>
                  <div className="text-sm font-bold">Movie / Show Night</div>
                  <div className="text-xs text-slate-400">
                    Watch movies, series, or video clips in sync.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectMode("sports")}
                className={`p-4 rounded-xl border text-left flex items-center gap-4 transition ${
                  roomMode === "sports"
                    ? "bg-emerald-600/20 border-emerald-500 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <span className="text-3xl">⚽</span>
                <div>
                  <div className="text-sm font-bold">Live Football / Sports Match</div>
                  <div className="text-xs text-slate-400">
                    Stream live sports broadcasts with friends.
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setIsModeSelectorOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300 text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Vibe / Match Matcher Modal */}
      <VibeModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        onSelectMovie={handleLoadVideo}
      />
    </div>
  );
}