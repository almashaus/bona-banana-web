import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Event, EventStatus } from "@/src/models/event";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const eventsSnapshot = await db
      .collection("events")
      .where("status", "==", EventStatus.PUBLISHED)
      .orderBy("updatedAt", "desc")
      .get();

    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);

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
