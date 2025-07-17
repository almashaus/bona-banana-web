import { getEventsByStatus } from "@/src/lib/firebase/firestore";
import { Event, EventStatus } from "@/src/models/event";

export async function GET() {
  try {
    const events: Event[] = await getEventsByStatus(EventStatus.PUBLISHED);

    return new Response(JSON.stringify(events), {
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
