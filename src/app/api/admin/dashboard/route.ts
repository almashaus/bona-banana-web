export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { formatDate } from "@/src/lib/utils/formatDate";
import { DashboardEvent, Event } from "@/src/models/event";
import { Ticket } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user"; // Add this import
import { AggregateField } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

function getDateRangeStrings(startDate: Date, days: number): Set<string> {
  const set = new Set<string>();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    set.add(formatDate(d));
  }
  return set;
}

export async function GET() {
  try {
    const today = new Date();
    const rangeSet = getDateRangeStrings(today, 30);

    // Fetch all events
    const eventsSnapshot = await db.collection("events").get();
    const eventsNumber = eventsSnapshot.docs.length;

    // Process events and their tickets
    const dashboardEvents: DashboardEvent[] = [];
    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);

    const ticketsPromises = events.flatMap((event) =>
      event.dates.map(async (date) => {
        const formattedDate = formatDate(new Date(date.date));

        if (rangeSet.has(formattedDate)) {
          const ticketsSnapshot = await db
            .collection("tickets")
            .where("eventDateId", "==", date.id)
            .get();

          // For each ticket, fetch user data and attach to ticket
          const ticketsWithUser: (Ticket & { user: AppUser })[] =
            await Promise.all(
              ticketsSnapshot.docs.map(async (doc) => {
                const ticket = doc.data() as Ticket;
                let user: AppUser;

                const userDoc = await db
                  .collection("users")
                  .doc(ticket.userId)
                  .get();
                user = userDoc.exists
                  ? (userDoc.data() as AppUser)
                  : {
                      id: "Unknown",
                      email: "Unknown",
                      name: "Unknown",
                      phone: "Unknown",
                      hasDashboardAccess: false,
                    };

                return { ...ticket, user };
              }),
            );

          dashboardEvents.push({
            eventDate: date,
            tickets: ticketsWithUser,
            ...event,
          });
        }
      }),
    );

    await Promise.all(ticketsPromises);

    // Sort events by date
    const sortedEvents = dashboardEvents.sort(
      (a, b) =>
        new Date(a.eventDate.date).getTime() -
        new Date(b.eventDate.date).getTime(),
    );

    // count
    const collectionRef = db.collection("tickets");
    const snapshotCount = await collectionRef.count().get();
    const ticketsCount = snapshotCount.data().count;

    // sum
    const sumQuery = collectionRef.aggregate({
      totalPurchasePrice: AggregateField.sum("purchasePrice"),
    });

    const snapshotSum = await sumQuery.get();
    const ticketsTotal = snapshotSum.data().totalPurchasePrice;

    return new Response(
      JSON.stringify({
        events: sortedEvents,
        eventsNumber: eventsNumber,
        ticketsCount: ticketsCount,
        ticketsTotal: ticketsTotal,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
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
