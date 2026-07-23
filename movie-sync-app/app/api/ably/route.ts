import Ably from "ably";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Ably API Key is missing." },
      { status: 500 }
    );
  }

  const client = new Ably.Rest(apiKey);
  const tokenRequestData = await client.auth.createTokenRequest({
    clientId: `user-${Math.random().toString(36).substring(2, 9)}`,
  });

  return NextResponse.json(tokenRequestData);
}