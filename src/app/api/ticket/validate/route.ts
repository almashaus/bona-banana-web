import { NextRequest } from "next/server";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Ticket, TicketStatus } from "@/src/models/ticket";

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

  const ticket = ticketsSnapshot.docs[0].exists
    ? (ticketsSnapshot.docs[0].data() as Ticket)
    : null;

  if (!ticket) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (ticket.status == TicketStatus.USED) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db
    .collection("tickets")
    .doc(ticket.id)
    .update({ status: TicketStatus.USED });

  return new Response(JSON.stringify({ valid: false, ticket }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
