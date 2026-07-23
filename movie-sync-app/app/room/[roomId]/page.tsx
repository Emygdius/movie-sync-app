"use client";

import { useState, useEffect, useRef, use } from "react";
import { useUser } from "@clerk/nextjs";
import * as Ably from "ably";
import Hls from "hls.js";
import VibeModal from "../../components/VibeModal";
import MomentModal from "../../components/MomentModal";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  const { user, isLoaded } = useUser();

  // Room Mode State
  const [roomMode, setRoomMode] = useState<"movie" | "sports">("movie");
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  // Live Score State (football-data.org integration)
  const [liveMatch, setLiveMatch] = useState<{
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    league: string;
  } | null>(null);

  // Video & Chat State
  const [videoUrl, setVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [inputUrl, setInputUrl] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: "System", text: `Welcome to ESync Room [${roomId}]! ⚽🍿` },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Vibe & Moment Modal States
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [isMomentModalOpen, setIsMomentModalOpen] = useState(false);

  // Active Interruption Overlay State
  const [activeMoment, setActiveMoment] = useState<{
    message: string;
    style: "love" | "celebrate";
  } | null>(null);

  // Host Permission Logic & Interactive Role Switcher
  const [hostId, setHostId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(true); // Defaults to true for room creator

  // Real-time Refs & Channel State
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const [channelInstance, setChannelInstance] = useState<Ably.RealtimeChannel | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isRemoteAction = useRef(false);

  // WebRTC Setup
  const {
    localStream,
    remoteStream,
    toggleVideo,
    toggleAudio,
    isVideoMuted,
    isAudioMuted,
  } = useWebRTC(channelInstance, isHost);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Bind WebRTC Local Stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind WebRTC Remote Stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Set initial host from Clerk user
  useEffect(() => {
    if (user && !hostId) {
      setHostId(user.id);
    }
  }, [user, hostId]);

  // Fetch real-time live match data from /api/livescores
  useEffect(() => {
    if (roomMode !== "sports") return;

    const fetchLiveScores = async () => {
      try {
        const res = await fetch("/api/livescores");
        const data = await res.json();

        if (data.matches && data.matches.length > 0) {
          const match = data.matches[0];
          setLiveMatch({
            homeTeam: match.homeTeam.shortName || match.homeTeam.name,
            awayTeam: match.awayTeam.shortName || match.awayTeam.name,
            homeScore: match.score.fullTime.home ?? match.score.halfTime.home ?? 0,
            awayScore: match.score.fullTime.away ?? match.score.halfTime.away ?? 0,
            league: match.competition.name,
          });
        } else {
          setLiveMatch(null);
        }
      } catch (err) {
        console.error("Failed to load live score:", err);
      }
    };

    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [roomMode]);

  // Handle Video Sources (Standard MP4 & HLS .m3u8 Streams)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (videoUrl.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl;
      }
    } else {
      video.src = videoUrl;
    }
  }, [videoUrl]);

  // Connect to Ably WebSocket Channel using dynamic roomId
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/ably" });
    const channel = client.channels.get(`esync-room-${roomId}`);
    channelRef.current = channel;
    setChannelInstance(channel);

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

    channel.subscribe("special-moment", (msg) => {
      setActiveMoment(msg.data);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    });

    channel.subscribe("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg.data]);
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [roomId]);

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

    channelRef.current?.publish("sync-video", {
      type: "CHANGE_MODE",
      mode: mode,
    });
  };

  const handleTriggerMoment = (message: string, style: "love" | "celebrate") => {
    if (!isHost) return;
    channelRef.current?.publish("special-moment", { message, style });
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
      const payload = { sender: senderName, text: chatInput.trim() };
      channelRef.current?.publish("chat-message", payload);
      setChatInput("");
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUserName = user?.firstName || "Guest";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            ESync
          </h1>

          {/* Room ID Badge */}
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            Room: {roomId}
          </span>

          {/* Mode Switcher */}
          <button
            onClick={() => isHost && setIsModeSelectorOpen(true)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition flex items-center gap-1 ${
              roomMode === "sports"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
          >
            {roomMode === "sports" ? "⚽ Live Football" : "🍿 Movie Night"}
            {isHost && <span className="text-[10px] opacity-70">⚙️</span>}
          </button>

          {/* Interactive Role Switcher Toggle */}
          <button
            onClick={() => setIsHost(!isHost)}
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border transition ${
              isHost
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
            title="Click to toggle between Host and Guest controls"
          >
            {isHost ? "👑 Host" : "🍿 Guest"}{" "}
            <span className="text-[10px] opacity-70">(Toggle)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1"
          >
            💬 {isChatOpen ? "Hide Chat" : "Show Chat"}
          </button>

          {/* Share Room Link Button */}
          <button
            onClick={copyRoomLink}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1"
          >
            {copied ? "✓ Link Copied!" : "🔗 Share Room"}
          </button>

          <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
            ● Connected
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        {/* Main Video Stream Container */}
        <div className={`${isChatOpen ? "lg:col-span-3" : "lg:col-span-4"} flex flex-col gap-4 transition-all`}>
          
          {/* Real Live Football Match Scoreboard */}
          {roomMode === "sports" && liveMatch ? (
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {liveMatch.league}
                </span>
                <span className="text-xs text-rose-500 font-bold animate-pulse flex items-center gap-1">
                  ● LIVE
                </span>
              </div>

              {/* Match Teams & Score */}
              <div className="flex items-center gap-4 text-sm font-extrabold text-white">
                <span>{liveMatch.homeTeam}</span>
                <span className="bg-slate-950 border border-emerald-500/40 px-3 py-1 rounded-md text-emerald-400 font-mono text-base">
                  {liveMatch.homeScore} - {liveMatch.awayScore}
                </span>
                <span>{liveMatch.awayTeam}</span>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block">
                ⚡ Live Score Tracker Active
              </div>
            </div>
          ) : roomMode === "sports" && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-center text-xs text-slate-400">
              ⚽ No live matches currently in progress for the available leagues.
            </div>
          )}

          <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none">
            <video
              ref={videoRef}
              controls
              playsInline
              onPlay={handlePlay}
              onPause={handlePause}
              className="w-full h-full object-contain"
            />

            {/* Special Interruption Overlay */}
            {activeMoment && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="text-5xl mb-3">
                  {activeMoment.style === "love" ? "💖" : "🎉"}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  {activeMoment.style === "love" ? "A Special Moment" : "Match Celebration!"}
                </h3>
                <p className="text-base text-indigo-200 max-w-lg mb-6 font-medium">
                  "{activeMoment.message}"
                </p>
                <button
                  onClick={() => setActiveMoment(null)}
                  className="bg-white text-slate-900 text-xs px-5 py-2 rounded-full font-bold shadow-lg hover:bg-slate-200 transition"
                >
                  Resume Watch Party 🍿
                </button>
              </div>
            )}
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
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                ✨ {roomMode === "sports" ? "Match Matcher" : "Vibe Matcher"}
              </button>

              <button
                onClick={() => setIsMomentModalOpen(true)}
                className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:opacity-90 text-pink-300 border border-pink-500/30 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap"
              >
                💖 Trigger Moment
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center text-xs text-slate-400">
              🔒 Only the host can change the {roomMode === "sports" ? "match" : "movie"} stream. Sit back and enjoy!
            </div>
          )}
        </div>

        {/* Right Sidebar: Video Cameras + Collapsible Live Chat */}
        {isChatOpen && (
          <div className="flex flex-col gap-4">
            {/* Live Camera Grid Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-300 flex justify-between items-center pb-1 border-b border-slate-800">
                <span>📹 Live Feeds</span>
                <span className="text-[10px] text-emerald-400">● WebRTC Active</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Partner Feed */}
                <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative shadow">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 text-center p-1">
                      Waiting for Partner...
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1.5 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                    Partner
                  </div>
                </div>

                {/* Local Feed */}
                <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative shadow group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoMuted ? "hidden" : "block"}`}
                  />
                  {isVideoMuted && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500">
                      Cam Off
                    </div>
                  )}

                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={toggleAudio}
                      className="bg-black/70 p-1 rounded text-[10px] hover:bg-black"
                    >
                      {isAudioMuted ? "🔇" : "🎙️"}
                    </button>
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className="bg-black/70 p-1 rounded text-[10px] hover:bg-black"
                    >
                      {isVideoMuted ? "📷" : "📹"}
                    </button>
                  </div>

                  <div className="absolute bottom-1 left-1.5 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                    You
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Chat */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col flex-1 h-[400px] lg:h-auto overflow-hidden">
              <div className="p-3 border-b border-slate-800 font-semibold text-slate-300 text-sm flex justify-between items-center">
                <span>Live Chat</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  ESync
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs text-slate-300">
                {messages.map((msg, index) => {
                  const isUserMsg = msg.sender === currentUserName;
                  const isSystem = msg.sender === "System";

                  if (isSystem) {
                    return (
                      <div
                        key={index}
                        className="bg-slate-800/40 text-slate-400 p-2 rounded-lg text-[11px] text-center border border-slate-800"
                      >
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isUserMsg ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-500 px-1 mb-0.5">
                        {msg.sender}
                      </span>
                      <div
                        className={`p-2 rounded-xl text-xs max-w-[85%] break-words ${
                          isUserMsg
                            ? "bg-indigo-600 text-white rounded-br-none shadow"
                            : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50"
                        }`}
                      >
                        {msg.text}
                      </div>
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
                  className="bg-indigo-600 text-xs px-3.5 py-2 rounded-lg font-semibold hover:bg-indigo-500 text-white transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
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

      {/* Special Moment Modal */}
      <MomentModal
        isOpen={isMomentModalOpen}
        onClose={() => setIsMomentModalOpen(false)}
        onTriggerMoment={handleTriggerMoment}
      />
    </div>
  );
}