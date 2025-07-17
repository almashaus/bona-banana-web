import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { addDocToCollection } from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest } from "next/server";
import { Order } from "@/src/models/order";
import { Ticket } from "@/src/models/ticket";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, tickets }: { order: Order; tickets: Ticket[] } = body;

    const theOrder = {
      ...order,
      orderDate: Timestamp.fromDate(new Date()),
    };

    await db.collection("orders").doc(order.id).set(theOrder);

    await Promise.all(
      tickets.map((ticket) =>
        db.collection("tickets").doc(ticket.id).set(ticket)
      )
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`&&&& ${error}`);
    return new Response(JSON.stringify({ error: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
