import OrderConfirmationEmail from "@/src/lib/utils/orderEmail";
import { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, order, event, dateId } = await req.json();

  const data = await resend.emails.send({
    from: "info@bona-banana.com",
    to: email,
    subject: "Order Confirmation",
    react: OrderConfirmationEmail(order, event, dateId),
  });

  return new Response(JSON.stringify({ data: "Email sent" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
