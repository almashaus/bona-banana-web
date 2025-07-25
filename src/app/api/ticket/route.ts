import { NextRequest } from "next/server";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Ticket } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user";
import { Event } from "@/src/models/event";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ticketsSnapshot = await db
    .collection("tickets")
    .where("token", "==", token)
    .get();

  const ticket =
    ticketsSnapshot.docs.length > 0 && ticketsSnapshot.docs[0].exists
      ? (ticketsSnapshot.docs[0].data() as Ticket)
      : null;

  if (!ticket) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userSnapshot = await db
    .collection("users")
    .where("id", "==", ticket.userId)
    .get();

  const user =
    userSnapshot.docs.length > 0 && userSnapshot.docs[0].exists
      ? (userSnapshot.docs[0].data() as AppUser)
      : null;

  const eventSnapshot = await db
    .collection("events")
    .where("id", "==", ticket.eventId)
    .get();

  const event =
    eventSnapshot.docs.length > 0 && eventSnapshot.docs[0].exists
      ? (eventSnapshot.docs[0].data() as Event)
      : null;

  return new Response(
    JSON.stringify({ user: user, event: event, ticket: ticket }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
