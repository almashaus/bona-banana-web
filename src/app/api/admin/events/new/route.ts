import { db, storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { getFileName } from "@/src/lib/utils/utils";
import { Event } from "@/src/models/event";
import { NextRequest, NextResponse } from "next/server";

async function renameFile(oldPath: string, newPath: string) {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(oldPath);
  await file.copy(bucket.file(newPath));
  await file.delete();
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
    const { event } = body;

    const eventData: Event = event;

    const docRef = db.collection("events").doc();

    if (eventData.eventLogo) {
      await renameFile(
        `events/${eventData.slug}/${getFileName(eventData.eventLogo)}`,
        `events/${docRef.id}/${getFileName(eventData.eventLogo)}`
      );

      // Update URLs to use event ID instead of slug
      eventData.eventLogo = eventData.eventLogo.replace(
        eventData.slug,
        docRef.id
      );
    }

    if (eventData.eventImage) {
      await renameFile(
        `events/${eventData.slug}/${getFileName(eventData.eventImage)}`,
        `events/${docRef.id}/${getFileName(eventData.eventImage)}`
      );

      // Update URLs to use event ID instead of slug
      eventData.eventImage = eventData.eventImage.replace(
        eventData.slug,
        docRef.id
      );
    }

    if (eventData.adImage) {
      await renameFile(
        `events/${eventData.slug}/${getFileName(eventData.adImage)}`,
        `events/${docRef.id}/${getFileName(eventData.adImage)}`
      );

      eventData.adImage = eventData.adImage.replace(eventData.slug, docRef.id);
    }

    await docRef.set({ ...eventData, id: docRef.id });

    if (docRef.id) {
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
    console.log(error);
    return new Response(JSON.stringify({ data: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
