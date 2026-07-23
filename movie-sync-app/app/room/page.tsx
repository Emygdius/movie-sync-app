"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import * as Ably from "ably";

export default function RoomPage() {
  const { user, isLoaded } = useUser();

  // State for Video & Chat
  const [videoUrl, setVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [inputUrl, setInputUrl] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "System: Welcome to your private watch room! ❤️",
  ]);
  const [chatInput, setChatInput] = useState("");

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

  // Connect to Ably WebSocket Channel using Token Auth route
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/ably" });
    const channel = client.channels.get("movie-room-1");
    channelRef.current = channel;

    // Listen for incoming sync events (Play, Pause, Change Movie)
    channel.subscribe("sync-video", (msg) => {
      const { type, url, time } = msg.data;
      isRemoteAction.current = true;

      if (type === "CHANGE_URL") {
        setVideoUrl(url);
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

    // Listen for incoming live chat messages
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

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost) return;

    if (inputUrl.trim()) {
      setVideoUrl(inputUrl);
      channelRef.current?.publish("sync-video", {
        type: "CHANGE_URL",
        url: inputUrl,
      });
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
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            MovieSync Room
          </h1>
          <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
            Date Night Mode
          </span>
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
        {/* Left Area: Video Player & Webcam Overlays */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
            {/* Main Movie Stream */}
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onPlay={handlePlay}
              onPause={handlePause}
              className="w-full h-full object-contain"
            />

            {/* Webcam Floating Cards (Overlays) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
              <div className="w-32 aspect-video bg-slate-900/90 rounded-lg border border-white/20 flex items-center justify-center text-[10px] text-slate-300 backdrop-blur shadow-lg">
                Partner Feed 📹
              </div>
              <div className="w-32 aspect-video bg-slate-900/90 rounded-lg border border-white/20 flex items-center justify-center text-[10px] text-slate-300 backdrop-blur shadow-lg">
                Your Feed 📹
              </div>
            </div>
          </div>

          {/* URL Input Bar (HOST ONLY vs GUEST VIEW) */}
          {isHost ? (
            <form onSubmit={handleLoadVideo} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste direct MP4 or video stream link..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Change Movie
              </button>
            </form>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center text-xs text-slate-400">
              🔒 Only the host can select or change the movie. Sit back and enjoy!
            </div>
          )}
        </div>

        {/* Right Area: Interactive Chat Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col h-[500px] lg:h-auto">
          <div className="p-3 border-b border-slate-800 font-semibold text-slate-300 text-sm">
            Live Chat
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
    </div>
  );
}