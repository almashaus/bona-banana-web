import { getEventById } from "@/src/lib/firebase/firestore";
import { Event } from "@/src/models/event";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    const event: Event = await getEventById(id);

    return new Response(JSON.stringify(event), {
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

export async function PUT(req: NextRequest, res: NextResponse) {
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

    const docRef = await db.collection("events").doc(event.id).set(event);

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
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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
    const { id, update, newDate } = body;

    if (newDate) {
      const eventSnap = await db.collection("events").doc(id).get();
      const currentStatus = eventSnap.data()?.status;

      const dateUpdate: Record<string, unknown> = {
        dates: FieldValue.arrayUnion(newDate),
        updatedAt: new Date().toISOString(),
      };

      if (currentStatus === "completed") {
        dateUpdate.status = "published";
      }

      await db.collection("events").doc(id).update(dateUpdate);
    } else {
      await db.collection("events").doc(id).update({
        ...update,
        updatedAt: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ data: "Success" }), {
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
