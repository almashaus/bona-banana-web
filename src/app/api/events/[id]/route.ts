import { getDocumentByKey } from "@/src/lib/firebase/firestore";
import { Event } from "@/src/models/event";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const slug = (await params).id;

    const event: Event = (await getDocumentByKey(
      "events",
      "slug",
      slug,
    )) as Event;
    if (event) {
      return new Response(JSON.stringify(event), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
