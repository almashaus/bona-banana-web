import { db } from "@/src/lib/firebase/firebaseConfig";
import { db as admindb } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { DashboardEvent, Event } from "@/src/models/event";
import { Ticket } from "@/src/models/ticket";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest } from "next/server";

function getDateRangeStrings(startDate: Date, days: number): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    set.add(d.toISOString().split("T")[0]);
  }
  return set;
}

export async function GET() {
  try {
    const today = new Date();
    const rangeSet = getDateRangeStrings(today, 30);

    // Fetch all events
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const eventsNumber = eventsSnapshot.docs.length;

    // Process events and their tickets
    const dashboardEvents: DashboardEvent[] = [];
    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);

    const ticketsPromises = events.flatMap((event) =>
      event.dates.map(async (date) => {
        const formattedDate = new Date(date.date).toISOString().split("T")[0];
        if (rangeSet.has(formattedDate)) {
          const ticketsSnapshot = await getDocs(
            query(
              collection(db, "tickets"),
              where("eventDateId", "==", date.id)
            )
          );

          const tickets: Ticket[] = ticketsSnapshot.docs.map(
            (doc) => doc.data() as Ticket
          );

          dashboardEvents.push({
            eventDate: date,
            tickets: tickets,
            ...event,
          });
        }
      })
    );

    await Promise.all(ticketsPromises);

    // Sort events by date
    const sortedEvents = dashboardEvents.sort(
      (a, b) =>
        new Date(a.eventDate.date).getTime() -
        new Date(b.eventDate.date).getTime()
    );

    return new Response(
      JSON.stringify({ events: sortedEvents, number: eventsNumber }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching dashboard events:", error);
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

    await admindb.collection("tickets").doc(id).update(data);

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
