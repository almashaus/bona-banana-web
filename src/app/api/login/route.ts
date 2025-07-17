import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const body = await req.json();
    const { member } = body;

    if (!member) {
      return new Response(JSON.stringify({ data: "Missing member" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const cookieStore = await cookies();
    cookieStore.set("member", member, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // month
    });

    return new Response(JSON.stringify({ message: "Logged In" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
