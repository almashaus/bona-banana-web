import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import OrderConfirmationEmail from "@/src/lib/utils/orderEmail";
import { Order } from "@/src/models/order";
import { Ticket } from "@/src/models/ticket";
import { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, order: orderBody, event } = await req.json();

    let order: Order;

    const docSnap = await db
      .collection("orders")
      .doc(orderBody.orderNumber)
      .get();

    if (docSnap.exists) {
      order = docSnap.data() as Order;
    } else {
      throw new Error("Error fetching data!");
    }

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("orderId", "==", orderBody.orderNumber)
      .get();

    const tickets: Ticket[] = ticketsSnapshot.docs.map((doc) =>
      doc.data(),
    ) as Ticket[];

    const data = await resend.emails.send({
      from: "Bona Banana <info@bona-banana.com>",
      to: email,
      subject: "Order Confirmation",
      react: OrderConfirmationEmail(order, tickets, event),
    });

    if (data.data) {
      return new Response(JSON.stringify({ data: "Email sent" }), {
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
