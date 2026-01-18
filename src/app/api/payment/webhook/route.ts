import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { TicketStatus } from "@/src/models/ticket";
import { OrderStatus } from "@/src/models/order";

const MF_WEBHOOK_SECRET = process.env.MF_WEBHOOK_SECRET!;
const MF_BASE = process.env.MF_BASE_URL!;
const MF_TOKEN = process.env.MF_API_TOKEN!;

export async function POST(req: NextRequest) {
  // Read raw body as text — required for signature verification
  const rawBody = await req.text();
  console.log("webhook body :>>", rawBody);

  const headerSignature =
    req.headers.get("myfatoorah-signature") ||
    req.headers.get("MyFatoorah-Signature");

  if (!headerSignature) {
    return new NextResponse("Missing signature", { status: 400 });
  }
  console.log("headerSignature :>> ", headerSignature);

  try {
    const header = headerSignature.trim();

    // Compute HMAC-SHA256 using the raw body and compare to header
    const computed = crypto
      .createHmac("sha256", MF_WEBHOOK_SECRET)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");

    console.log("computed :>> ", computed);

    // Timing-safe compare
    const isMatch =
      safeCompare(header, computed) ||
      safeCompare(header, computed.replace(/\=+$/, ""));

    if (!isMatch) {
      console.log("NOT MATCH");
      return new NextResponse("Invalid webhook signature", { status: 403 });
    }

    // Parse event
    const payload = JSON.parse(rawBody);

    const eventType = payload?.Event.Name;
    const data = payload?.Data;
    const invoiceStatus = data.Invoice.Status;

    if (eventType && eventType.toLowerCase().includes("payment")) {
      const paymentId = data.Transaction.PaymentId;

      if (paymentId) {
        const resp = await fetch(`${MF_BASE}/v2/GetPaymentStatus`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Key: paymentId, KeyType: "PaymentId" }),
        });

        if (!resp.ok)
          return new NextResponse("Payment gateway error", { status: 502 });

        const statusData = await resp.json();
        if (
          statusData.Data.InvoiceStatus === "Paid" ||
          invoiceStatus === "PAID"
        ) {
          await updateOrder(statusData?.Data?.InvoiceId);

          console.log("Webhook success");
        }
      }
    }

    // success to MyFatoorah
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error", err);
    return new NextResponse("Server error", { status: 500 });
  }
}

// Timing-safe compare to avoid timing attacks
function safeCompare(a: string, b: string) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

async function updateOrder(invoiceId: string) {
  const orderSnapshot = await db
    .collection("orders")
    .where("invoiceId", "==", invoiceId)
    .get();

  // Collect all ticket queries
  const ticketPromises = orderSnapshot.docs.map((doc) =>
    db.collection("tickets").where("orderId", "==", doc.ref).get(),
  );

  const ticketSnapshots = await Promise.all(ticketPromises);

  // Single batch for everything
  const batch = db.batch();

  orderSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { orderStatus: OrderStatus.PAID });
  });

  ticketSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: TicketStatus.VALID });
    });
  });

  await batch.commit();
}
