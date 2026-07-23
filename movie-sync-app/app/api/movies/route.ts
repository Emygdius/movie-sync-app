import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("s");

  if (!query) {
    return NextResponse.json({ Search: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY || "5c096249";
  
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OMDb fetch error:", error);
    return NextResponse.json({ Search: [] }, { status: 500 });
  }
}