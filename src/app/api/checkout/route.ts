import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { NextRequest, NextResponse } from "next/server";
import { Order, OrderStatus } from "@/src/models/order";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { Coupon } from "@/src/models/coupon";
import crypto from "crypto";
import { sendOrderConfirmationEmail } from "@/src/lib/firebase/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, tickets }: { order: Order; tickets: Ticket[] } = body;

    await db.collection("orders").doc(order.id).set(order);

    await Promise.all(
      tickets.map((ticket) => {
        const token = crypto.randomBytes(16).toString("hex");
        return db
          .collection("tickets")
          .doc(ticket.id)
          .set({ ...ticket, token });
      }),
    );

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Checkout POST error:", error);
    return NextResponse.json(
      { error: "Error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent: if already paid or canceled, do nothing
    if (orderDoc.data()?.status !== OrderStatus.PENDING) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("orderId", "==", orderId)
      .get();

    const batch = db.batch();
    batch.update(orderRef, { status: OrderStatus.CANCELED });
    ticketsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: TicketStatus.CANCELED });
    });
    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Checkout PATCH error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email } = body;

    await db
      .collection("orders")
      .doc(orderId)
      .update({ status: OrderStatus.PAID });

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("orderId", "==", orderId)
      .get();

    if (ticketsSnapshot.empty) {
      return NextResponse.json(
        { error: `No tickets found for orderId: ${orderId}` },
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const batch = db.batch();
    ticketsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: TicketStatus.VALID });
    });
    await batch.commit();

    // Redeem coupon on successful payment
    const orderDoc = await db.collection("orders").doc(orderId).get();
    const orderData = orderDoc.data();

    if (orderData?.couponId) {
      const couponRef = db.collection("coupons").doc(orderData.couponId);
      const couponDoc = await couponRef.get();

      if (couponDoc.exists) {
        const coupon = couponDoc.data() as Coupon;
        const newUsageCount = coupon.usageCount + 1;
        const newDiscountImpact =
          coupon.discountImpact + (orderData.discountAmount ?? 0);
        const newRevenueImpact =
          coupon.revenueImpact + (orderData.totalAmount ?? 0);

        const couponUpdate: Record<string, unknown> = {
          usageCount: newUsageCount,
          discountImpact: newDiscountImpact,
          revenueImpact: newRevenueImpact,
          updatedAt: new Date().toISOString(),
        };

        if (
          coupon.usageLimit !== null &&
          newUsageCount >= coupon.usageLimit
        ) {
          couponUpdate.status = "Fully Redeemed";
        }

        await couponRef.update(couponUpdate);

        await db.collection("couponUsages").add({
          couponId: orderData.couponId,
          orderId,
          userId: orderData.userId,
          discountAmount: orderData.discountAmount ?? 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    await sendOrderConfirmationEmail(email, orderId);

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
