import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete("member");

  return new Response(JSON.stringify({ message: "Logged Out" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
