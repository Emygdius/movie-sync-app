"use client";

import { useEffect, useRef, useState } from "react";
import * as Ably from "ably";

export function useWebRTC(channel: Ably.RealtimeChannel | null, isHost: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) return;
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.warn("Camera/Microphone access denied or unavailable:", err);
      }
    }

    initMedia();

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!channel || !localStream) return;

    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    // Add local tracks to WebRTC peer connection
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // Handle incoming remote stream tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send ICE candidates via Ably signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.publish("signal-ice", event.candidate);
      }
    };

    // Listen for WebRTC signals over Ably
    const signalSub = channel.subscribe("signal-offer", async (msg) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      channel.publish("signal-answer", answer);
    });

    const answerSub = channel.subscribe("signal-answer", async (msg) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.data));
    });

    const iceSub = channel.subscribe("signal-ice", async (msg) => {
      if (!pcRef.current || !msg.data) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.data));
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    });

    // Host initiates offer connection
    if (isHost) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        channel.publish("signal-offer", offer);
      });
    }

    return () => {
      channel.unsubscribe("signal-offer");
      channel.unsubscribe("signal-answer");
      channel.unsubscribe("signal-ice");
      pc.close();
    };
  }, [channel, localStream, isHost]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    toggleVideo,
    toggleAudio,
    isVideoMuted,
    isAudioMuted,
  };
}