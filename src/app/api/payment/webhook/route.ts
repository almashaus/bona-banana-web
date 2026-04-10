import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { TicketStatus } from "@/src/models/ticket";
import { OrderStatus } from "@/src/models/order";
import { BookingStatus } from "@/src/models/campaign/campaign";

const MF_WEBHOOK_SECRET = process.env.MF_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const headerSignature =
    req.headers.get("myfatoorah-signature") ||
    req.headers.get("MyFatoorah-Signature");

  if (!headerSignature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventName = payload?.Event?.Name;

  let signingString = "";
  if (eventName === "PAYMENT_STATUS_CHANGED") {
    signingString = buildPaymentStatusChangedSigningString(payload);
  } else {
    return new NextResponse("Unsupported event", { status: 400 });
  }

  const computed = crypto
    .createHmac("sha256", MF_WEBHOOK_SECRET)
    .update(signingString, "utf8")
    .digest("base64");

  const header = headerSignature.trim();
  const isMatch =
    safeCompare(header, computed) ||
    safeCompare(header, computed.replace(/\=+$/, ""));

  if (!isMatch) {
    console.log("Not Match");
    return new NextResponse("Invalid webhook signature", { status: 403 });
  }

  const invoiceStatus = payload?.Data?.Invoice?.Status;
  const invoiceId = payload?.Data?.Invoice?.Id;

  if (invoiceStatus === "Paid") {
    await markOrderPaid(invoiceId);
  } else {
    await cancelOrder(invoiceId);
  }

  console.log("Webhook success:", invoiceStatus);
  return new NextResponse("OK", { status: 200 });
}

function v(val: any) {
  return val === null || val === undefined ? "" : String(val);
}

function buildPaymentStatusChangedSigningString(payload: any) {
  const invoice = payload?.Data?.Invoice ?? {};
  const txn = payload?.Data?.Transaction ?? {};

  return [
    `Invoice.Id=${v(invoice.Id)}`,
    `Invoice.Status=${v(invoice.Status)}`,
    `Transaction.Status=${v(txn.Status)}`,
    `Transaction.PaymentId=${v(txn.PaymentId)}`,
    `Invoice.ExternalIdentifier=${v(invoice.ExternalIdentifier)}`,
  ].join(",");
}

function safeCompare(a: string, b: string) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

async function markOrderPaid(invoiceId: string) {
  try {
    // Check regular orders first
    const orderSnapshot = await db
      .collection("orders")
      .where("invoiceId", "==", invoiceId)
      .get();

    if (!orderSnapshot.empty) {
      const ticketPromises = orderSnapshot.docs.map((doc) =>
        db.collection("tickets").where("orderId", "==", doc.id).get(),
      );

      const ticketSnapshots = await Promise.all(ticketPromises);

      const batch = db.batch();

      orderSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: OrderStatus.PAID });
      });

      ticketSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { status: TicketStatus.VALID });
        });
      });

      await batch.commit();
      console.log("Order marked paid");
      return;
    }

    // Check campaign orders
    const campaignOrderSnap = await db
      .collection("campaignOrders")
      .where("invoiceId", "==", invoiceId)
      .get();

    if (!campaignOrderSnap.empty) {
      const batch = db.batch();

      for (const orderDoc of campaignOrderSnap.docs) {
        batch.update(orderDoc.ref, { status: OrderStatus.PAID });

        const orderData = orderDoc.data();
        const { campaignId, sessionIds } = orderData;

        // Update bookings to paid
        const bookingsSnap = await db
          .collection("campaigns")
          .doc(campaignId)
          .collection("bookings")
          .where("orderId", "==", orderDoc.id)
          .get();

        const playerIds = new Set<string>();
        bookingsSnap.docs.forEach((bDoc) => {
          batch.update(bDoc.ref, { status: BookingStatus.PAID });
          if (bDoc.data().playerId) playerIds.add(bDoc.data().playerId);
        });

        // Assign user to player slots
        for (const playerId of playerIds) {
          const playerRef = db
            .collection("campaigns")
            .doc(campaignId)
            .collection("players")
            .doc(playerId);
          batch.update(playerRef, { assignedUserId: orderData.userId });
        }
      }

      await batch.commit();
      console.log("Campaign order marked paid");
    }
  } catch (error) {
    console.log("markOrderPaid error :>> ", error);
  }
}

async function cancelOrder(invoiceId: string) {
  try {
    // Check regular orders first
    const orderSnapshot = await db
      .collection("orders")
      .where("invoiceId", "==", invoiceId)
      .get();

    if (!orderSnapshot.empty) {
      const ticketPromises = orderSnapshot.docs.map((doc) =>
        db.collection("tickets").where("orderId", "==", doc.id).get(),
      );

      const ticketSnapshots = await Promise.all(ticketPromises);

      const batch = db.batch();

      orderSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: OrderStatus.CANCELED });
      });

      ticketSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { status: TicketStatus.CANCELED });
        });
      });

      await batch.commit();
      console.log("Order canceled");
      return;
    }

    // Check campaign orders
    const campaignOrderSnap = await db
      .collection("campaignOrders")
      .where("invoiceId", "==", invoiceId)
      .get();

    if (!campaignOrderSnap.empty) {
      const batch = db.batch();

      for (const orderDoc of campaignOrderSnap.docs) {
        batch.update(orderDoc.ref, { status: OrderStatus.CANCELED });

        const orderData = orderDoc.data();

        // Delete pending bookings
        const bookingsSnap = await db
          .collection("campaigns")
          .doc(orderData.campaignId)
          .collection("bookings")
          .where("orderId", "==", orderDoc.id)
          .get();

        bookingsSnap.docs.forEach((bDoc) => {
          batch.delete(bDoc.ref);
        });
      }

      await batch.commit();
      console.log("Campaign order canceled");
    }
  } catch (error) {
    console.log("cancelOrder error :>> ", error);
  }
}
