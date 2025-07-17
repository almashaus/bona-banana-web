import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { getAllDocuments, getEvents } from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Event } from "@/src/models/event";
import { Ticket } from "@/src/models/ticket";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const events: Event[] = await getEvents();

    const tickets: Ticket[] = (await getAllDocuments("tickets")) as Ticket[];

    return new Response(JSON.stringify({ events: events, tickets: tickets }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";

    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return new Response(JSON.stringify({ data: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { id, data } = body;

    await db.collection("tickets").doc(id).update(data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error deleting event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing eventId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.collection("events").doc(eventId).delete();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error deleting event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
