import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const sessionSecret = process.env.POS_SESSION_SECRET;

  if (!sessionSecret) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(token, sessionSecret);

  return NextResponse.json({ authenticated }, { status: 200 });
}
