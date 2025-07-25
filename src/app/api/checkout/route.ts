import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { NextRequest } from "next/server";
import { Order } from "@/src/models/order";
import { Ticket } from "@/src/models/ticket";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, tickets }: { order: Order; tickets: Ticket[] } = body;

    await db.collection("orders").doc(order.id).set(order);

    await Promise.all(
      tickets.map((ticket) => {
        const token = crypto.randomBytes(16).toString("hex");
        const url = `http://localhost:3000/ticket?token=${token}`;

        db.collection("tickets")
          .doc(ticket.id)
          .set({ ...ticket, token: token });
      })
    );

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
