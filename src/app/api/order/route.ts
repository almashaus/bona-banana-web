import { db } from "@/src/lib/firebase/firebaseConfig";
import { getDocumentById, getEventById } from "@/src/lib/firebase/firestore";
import { Event } from "@/src/models/event";
import { Order } from "@/src/models/order";
import { Ticket } from "@/src/models/ticket";
import { collection, getDocs, query, where } from "@firebase/firestore";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get("orderNumber");

    const order: Order = (await getDocumentById(
      "orders",
      orderNumber as string
    )) as Order;

    const event: Event = await getEventById(order.eventId);

    const ticketsQuery = query(
      collection(db, "tickets"),
      where("orderId", "==", orderNumber)
    );
    const ticketsSnapshot = await getDocs(ticketsQuery);
    const tickets = ticketsSnapshot.docs.map((doc) => doc.data() as Ticket);

    if (order && event && tickets) {
      return new Response(
        JSON.stringify({ order: order, event: event, tickets: tickets }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(JSON.stringify({ data: "Error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ data: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
