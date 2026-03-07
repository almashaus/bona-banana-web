import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { nowDateInRiyadh } from "@/src/lib/utils/formatDate";
import { Event, EventStatus } from "@/src/models/event";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const eventsSnapshot = await db
      .collection("events")
      .where("status", "in", [EventStatus.PUBLISHED])
      .orderBy("updatedAt", "desc")
      .get();

    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);

    const now = nowDateInRiyadh();
    const getNearestDate = (event: Event) => {
      let nearest;
      for (const ed of event.dates) {
        const rawDate: any = ed.date;
        const d =
          rawDate && typeof rawDate.toDate === "function"
            ? rawDate.toDate()
            : new Date(rawDate);
        if (
          !nearest ||
          Math.abs(d.getTime() - now.getTime()) <
            Math.abs(nearest.getTime() - now.getTime())
        ) {
          nearest = d;
        }
      }
      return nearest as Date;
    };

    events.sort((a, b) => {
      // sort by nearest date to now
      return getNearestDate(a).getTime() - getNearestDate(b).getTime();
    });

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
