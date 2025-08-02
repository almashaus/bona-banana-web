import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { OrderResponse } from "@/src/models/order";
import { NextRequest } from "next/server";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Event } from "@/src/models/event";

export async function GET() {
  try {
    const ordersSnapshot = await db
      .collection("orders")
      .orderBy("orderDate", "desc")
      .get();

    const orders = await Promise.all(
      ordersSnapshot.docs.map(async (docData) => {
        const orderData = docData.data();
        const orderId = docData.id;

        // Get tickets for this order
        const ticketsSnapshot = await db
          .collection("tickets")
          .where("orderId", "==", orderId)
          .get();
        const ticketsData = ticketsSnapshot.docs.map((doc) => doc.data());

        // Get user for the first ticket (if exists)
        let userData: Record<string, any> = {};
        if (ticketsData.length > 0 && ticketsData[0].userId) {
          const userDoc = await db
            .collection("users")
            .doc(ticketsData[0].userId)
            .get();
          userData = userDoc.exists
            ? (userDoc.data() as Record<string, any>)
            : {};
        }

        // Get event for this order
        let eventData = null;
        if (orderData.eventId) {
          const eventDoc = await db
            .collection("events")
            .doc(orderData.eventId)
            .get();
          eventData = eventDoc.exists ? eventDoc.data() : null;
        }

        const event = eventData ? (eventData as Event) : { title: "Unknown" };

        return {
          orderNumber: orderData.id || orderId,
          customerName: userData?.name || "Unknown",
          contact: {
            email: userData?.email || "-",
            phone: userData?.phone || "-",
          },
          event: event,
          tickets: ticketsData,
          status: orderData.status,
          paymentMethod: orderData.paymentMethod,
          total: orderData.totalAmount,
          orderDate: orderData.orderDate,
        } as OrderResponse;
      })
    );
    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ data: "Failed to fetch orders" }), {
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

    await db.collection("orders").doc(id).update(data);

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
