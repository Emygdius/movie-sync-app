import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          MovieSync
        </h1>
        <p className="text-slate-400 text-lg">
          Watch movies and videos together in real-time, no matter how far apart you are.
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <Link 
            href="/room" 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition inline-block cursor-pointer"
          >
            Create Watch Room
          </Link>
          <button className="border border-slate-700 hover:bg-slate-900 text-slate-300 font-semibold px-6 py-3 rounded-lg transition">
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}