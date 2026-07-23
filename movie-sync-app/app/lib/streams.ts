export interface StreamItem {
  id: string;
  title: string;
  category: "sports" | "movie";
  thumbnail: string;
  url: string;
  description: string;
}

export const STREAMS: StreamItem[] = [
  {
    id: "sports-1",
    title: "Live Sports Test Channel (HLS Feed)",
    category: "sports",
    thumbnail: "⚽",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    description: "Real-time live multi-bitrate sports test broadcast.",
  },
  {
    id: "sports-2",
    title: "Action Sports & Stunts",
    category: "sports",
    thumbnail: "🏄",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "High-octane outdoor action highlights.",
  },
  {
    id: "movie-1",
    title: "Big Buck Bunny (4K Remaster)",
    category: "movie",
    thumbnail: "🍿",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Classic open-source animated feature film.",
  },
  {
    id: "movie-2",
    title: "Sintel (Sci-Fi Short)",
    category: "movie",
    thumbnail: "🐉",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description: "Fantasy adventure animation by the Blender Foundation.",
  },
  {
    id: "movie-3",
    title: "Tears of Steel",
    category: "movie",
    thumbnail: "🚀",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "VFX open sci-fi movie project.",
  },
];