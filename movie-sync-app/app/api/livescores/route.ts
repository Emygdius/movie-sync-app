import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY || "7e7a35a176354f08bc7648a91a5115ce";

  try {
    const res = await fetch("https://api.football-data.org/v4/matches?status=LIVE", {
      headers: {
        "X-Auth-Token": apiKey,
      },
      next: { revalidate: 30 }, // Cache response for 30 seconds
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Football API fetch error:", error);
    return NextResponse.json({ matches: [] }, { status: 500 });
  }
}