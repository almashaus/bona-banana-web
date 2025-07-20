import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import {
  getAllDocuments,
  getUsersWithDashboardAccess,
} from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Ticket } from "@/src/models/ticket";
import { AppUser, CustomerResponse } from "@/src/models/user";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const usersSnapshot = await db.collection("users").get();

    const customers: CustomerResponse[] = await Promise.all(
      usersSnapshot.docs.map(async (docData) => {
        const userData = docData.data() as AppUser;
        const userId = docData.id;

        const ticketsSnapshot = await db
          .collection("tickets")
          .where("userId", "==", userId)
          .get();
        const ticketsData = ticketsSnapshot.docs.map(
          (doc) => doc.data() as Ticket
        );
        return { user: userData, tickets: ticketsData };
      })
    );

    return new Response(JSON.stringify({ customers: customers }), {
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
