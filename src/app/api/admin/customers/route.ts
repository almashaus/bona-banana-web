export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Ticket } from "@/src/models/ticket";
import { AppUser, CustomerResponse } from "@/src/models/user";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();

    // Fetch tickets in batches (Firestore IN limit is 30)
    const userIds = usersSnapshot.docs.map((doc) => doc.id);
    const chunkSize = 30;
    const ticketChunks: QueryDocumentSnapshot[] = [];

    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      const snapshot = await db
        .collection("tickets")
        .where("userId", "in", chunk)
        .get();
      ticketChunks.push(...snapshot.docs);
    }

    const ticketsSnapshot = { docs: ticketChunks };

    // Get all unique eventIds from tickets
    const eventIdsSet = new Set<string>();
    ticketsSnapshot.docs.forEach((doc) => {
      const ticket = doc.data() as Ticket;
      eventIdsSet.add(ticket.eventId);
    });
    const eventIds = Array.from(eventIdsSet);

    // Fetch all relevant events in batches (Firestore IN limit is 30)
    let eventsMap: Record<string, string> = {};
    if (eventIds.length > 0) {
      const eventChunks: QueryDocumentSnapshot[] = [];
      for (let i = 0; i < eventIds.length; i += chunkSize) {
        const chunk = eventIds.slice(i, i + chunkSize);
        const snapshot = await db
          .collection("events")
          .where("id", "in", chunk)
          .get();
        eventChunks.push(...snapshot.docs);
      }
      eventsMap = eventChunks.reduce(
        (acc, doc) => {
          const event = doc.data();
          acc[event.id] = event.title;
          return acc;
        },
        {} as Record<string, string>,
      );
    }

    // Attach eventName to each ticket
    const ticketsMap = ticketsSnapshot.docs.reduce(
      (acc, doc) => {
        const ticket = doc.data() as Ticket;
        const eventName = eventsMap[ticket.eventId] || "";
        const ticketWithEventName = { ...ticket, eventName };
        if (!acc[ticket.userId]) acc[ticket.userId] = [];
        acc[ticket.userId].push(ticketWithEventName);
        return acc;
      },
      {} as Record<string, (Ticket & { eventName: string })[]>,
    );

    // Map users to customers
    const customers: CustomerResponse[] = usersSnapshot.docs.map((doc) => {
      const userData = doc.data() as AppUser;
      const userId = doc.id;
      return { user: userData, tickets: ticketsMap[userId] || [] };
    });

    return new Response(JSON.stringify({ customers: customers }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
