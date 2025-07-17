import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { getDocumentById } from "@/src/lib/firebase/firestore";
import OrderConfirmationEmail from "@/src/lib/utils/orderEmail";
import { Order } from "@/src/models/order";
import { Ticket } from "@/src/models/ticket";
import { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, orderNumber, event } = await req.json();

    const order: Order = (await getDocumentById(
      "orders",
      orderNumber
    )) as Order;

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("orderId", "==", orderNumber)
      .get();
    const tickets: Ticket[] = ticketsSnapshot.docs.map((doc) =>
      doc.data()
    ) as Ticket[];

    const data = await resend.emails.send({
      from: "Bona Banana <info@bona-banana.com>",
      to: "ihadeel.1024@gmail.com", // TODO: email
      subject: "Order Confirmation",
      react: OrderConfirmationEmail(order, tickets, event),
    });

    return new Response(JSON.stringify({ data: "Email sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
