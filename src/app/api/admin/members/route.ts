import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import {
  getAllDocuments,
  getUsersWithDashboardAccess,
} from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { AppUser } from "@/src/models/user";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const members: AppUser[] = await getUsersWithDashboardAccess();

    const users: AppUser[] = (await getAllDocuments("users")) as AppUser[];

    return new Response(JSON.stringify({ members: members, users: users }), {
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

export async function POST(req: NextRequest) {
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

    const user = {
      ...data,
      dashboard: {
        ...data.dashboard,
        joinedDate: new Date(),
      },
    };
    await db.collection("users").doc(id).update(user);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error deleting event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: NextRequest) {
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

    await db.collection("users").doc(id).update(data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error deleting event" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
