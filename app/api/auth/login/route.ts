import { NextResponse } from "next/server";
import {
  constantTimeEqual,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const configuredPasscode = process.env.POS_SHARED_PASSCODE;
  const sessionSecret = process.env.POS_SESSION_SECRET;

  if (!configuredPasscode || !sessionSecret) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Auth belum dikonfigurasi. Isi POS_SHARED_PASSCODE dan POS_SESSION_SECRET.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    passcode?: unknown;
  } | null;
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!constantTimeEqual(passcode, configuredPasscode)) {
    return NextResponse.json(
      { ok: false, message: "Passcode salah." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(sessionSecret);
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
