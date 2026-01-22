import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete("member");
  cookieStore.delete("session");

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
