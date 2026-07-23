"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoomRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Generate a quick unique room ID and redirect
    const randomId = Math.random().toString(36).substring(2, 8);
    router.replace(`/room/room-${randomId}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <p className="text-sm text-slate-400 animate-pulse">
        Creating your private ESync room...
      </p>
    </div>
  );
}