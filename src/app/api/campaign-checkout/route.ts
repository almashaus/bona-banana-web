import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@/src/models/order";
import { BookingStatus } from "@/src/models/campaign/campaign";
import { generateIDNumber, roundMoney } from "@/src/lib/utils/utils";

function campaignBookingId(sessionId: string, playerId: string) {
  return `${sessionId}${playerId.slice(playerId.lastIndexOf("_"))}`;
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(req.headers.get("Authorization") ?? "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, sessionIds, playerId, bookAll, paymentMethod } = body;

    if (!campaignId || !sessionIds?.length || !playerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch campaign to get price
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }
    const campaignData = campaignDoc.data()!;
    const pricePerSession = campaignData.price;

    // Validate player exists and is active
    const playerDoc = await db
      .collection("campaigns")
      .doc(campaignId)
      .collection("players")
      .doc(playerId)
      .get();

    if (!playerDoc.exists || !playerDoc.data()?.isActive) {
      return NextResponse.json(
        { error: "Player not found or inactive" },
        { status: 400 },
      );
    }

    // Use transaction to check availability and reserve bookings
    const orderId = generateIDNumber("CORDER");
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      // Check each session for existing paid bookings
      for (const sessionId of sessionIds) {
        const bookingId = campaignBookingId(sessionId, playerId);
        const bookingRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("bookings")
          .doc(bookingId);

        const existingBooking = await transaction.get(bookingRef);
        if (
          existingBooking.exists &&
          existingBooking.data()?.status === BookingStatus.PAID
        ) {
          throw new Error(`Player already booked for session ${sessionId}`);
        }
      }

      // Calculate totals
      const subtotal = pricePerSession * sessionIds.length;
      const discountAmount = bookAll ? roundMoney(subtotal * 0.1) : 0;
      const totalAmount = roundMoney(subtotal - discountAmount);

      // Create order
      const orderRef = db.collection("campaignOrders").doc(orderId);
      transaction.set(orderRef, {
        id: orderId,
        campaignId,
        sessionIds,
        userId: decoded.uid,
        invoiceId: "",
        paymentMethod: paymentMethod || "",
        totalAmount,
        discountAmount,
        status: OrderStatus.PENDING,
        orderDate: now,
      });

      // Create booking docs
      for (const sessionId of sessionIds) {
        const bookingId = campaignBookingId(sessionId, playerId);
        const bookingRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("bookings")
          .doc(bookingId);

        transaction.set(bookingRef, {
          id: bookingId,
          campaignId,
          sessionId,
          playerId,
          userId: decoded.uid,
          status: BookingStatus.PENDING,
          orderId,
          createdAt: now,
        });
      }
    });

    // Calculate response totals
    const subtotal = pricePerSession * sessionIds.length;
    const discountAmount = bookAll ? roundMoney(subtotal * 0.1) : 0;
    const totalAmount = roundMoney(subtotal - discountAmount);

    return NextResponse.json(
      { success: true, orderId, totalAmount, discountAmount },
      { status: 201 },
    );
  } catch (error) {
    console.error("Campaign checkout POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    const orderRef = db.collection("campaignOrders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent
    if (orderDoc.data()?.status !== OrderStatus.PENDING) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const orderData = orderDoc.data()!;
    const { campaignId, sessionIds } = orderData;

    const batch = db.batch();

    // Cancel order
    batch.update(orderRef, { status: OrderStatus.CANCELED });

    // Delete pending bookings
    for (const sessionId of sessionIds) {
      // Find bookings for this order
      const bookingsSnap = await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("bookings")
        .where("orderId", "==", orderId)
        .where("sessionId", "==", sessionId)
        .get();

      bookingsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Campaign checkout PATCH error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    const orderRef = db.collection("campaignOrders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order to paid
    await orderRef.update({ status: OrderStatus.PAID });

    const orderData = orderDoc.data()!;
    const { campaignId } = orderData;

    // fetch campaign data
    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "campaign not found" },
        { status: 404 },
      );
    }

    const campaignData = campaignDoc.data()!;

    // Update all bookings to paid and assign player
    const bookingsSnap = await db
      .collection("campaigns")
      .doc(campaignId)
      .collection("bookings")
      .where("orderId", "==", orderId)
      .get();

    const batch = db.batch();

    const playerIds = new Set<string>();

    bookingsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: BookingStatus.PAID });
      const bookingData = doc.data();
      if (bookingData.playerId) {
        playerIds.add(bookingData.playerId);
      }
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

    await batch.commit();

    return NextResponse.json(
      { success: true, campaign: campaignData },
      { status: 200 },
    );
  } catch (error) {
    console.error("Campaign checkout PUT error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
