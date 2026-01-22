import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/src/lib/firebase/firebaseAdminConfig";

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken)
    return NextResponse.json(
      { data: "Error" },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

  const expiresInMs = 14 * 24 * 60 * 60 * 1000; // 14 days
  const expiresInSec = Math.floor(expiresInMs / 1000);

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const claims = await auth.getUser(decodedToken.uid);

    // memeber access
    if (claims.customClaims?.admin) {
      cookies().set("member", "true", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: expiresInSec,
      });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });

    cookies().set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: expiresInSec,
    });

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return NextResponse.json(
      { data: "Error" },
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }
}
