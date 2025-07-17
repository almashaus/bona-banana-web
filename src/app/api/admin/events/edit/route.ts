import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Event } from "@/src/models/event";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
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
    const { event } = body;

    // Convert all eventDates fields to Firestore Timestamp
    const eventDatesWithTimestamps = (event as Event).dates.map((d) => ({
      ...d,
      date: Timestamp.fromDate(new Date(d.date)),
      startTime: Timestamp.fromDate(new Date(d.startTime)),
      endTime: Timestamp.fromDate(new Date(d.endTime)),
    }));

    const createdAt: Timestamp = event.createdAt;

    const theEvent = {
      ...event,
      createdAt: Timestamp.fromDate(
        new Date(
          new Timestamp(createdAt.seconds, createdAt.nanoseconds).toDate()
        )
      ),
      updatedAt: Timestamp.fromDate(new Date()),
      dates: eventDatesWithTimestamps,
    };

    const docRef = await db.collection("events").doc(theEvent.id).set(theEvent);

    if (docRef) {
      return new Response(JSON.stringify({ data: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ data: "Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
