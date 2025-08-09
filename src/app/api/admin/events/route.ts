import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Event } from "@/src/models/event";
import { Ticket } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const evetsSnapshot = await db
      .collection("events")
      .orderBy("updatedAt", "desc")
      .get();

    const eventsTickets = await Promise.all(
      evetsSnapshot.docs.map(async (docData) => {
        const eventData = docData.data() as Event;
        const eventId = docData.id;

        // Get tickets for this order
        const ticketsSnapshot = await db
          .collection("tickets")
          .where("eventId", "==", eventId)
          .get();

        const ticketsData = await Promise.all(
          ticketsSnapshot.docs.map(async (ticketDoc) => {
            const ticketData = ticketDoc.data() as Ticket;

            const userDoc = await db
              .collection("users")
              .doc(ticketData!.userId!)
              .get();

            const userData = userDoc.data() as AppUser;

            return {
              ticket: ticketData,
              user: userData,
            };
          })
        );

        return {
          event: eventData,
          tickets: ticketsData,
        };
      })
    );

    console.log(eventsTickets);

    return new Response(JSON.stringify(eventsTickets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(req: NextRequest) {
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
    return new Response(JSON.stringify({ error: "Error" }), {
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
    return new Response(JSON.stringify({ error: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
