import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { FieldValue } from "firebase-admin/firestore";
import { Coupon } from "@/src/models/coupon";
import { ProductOrder, ProductOrderStatus } from "@/src/models/productOrder";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order }: { order: ProductOrder } = body;

    if (
      !order?.id ||
      !order?.productId ||
      !order?.userId ||
      order?.price == null
    ) {
      return NextResponse.json(
        { error: "Invalid product order payload" },
        { status: 400 },
      );
    }

    await db.collection("productOrders").doc(order.id).set(order);

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Product checkout POST error:", error);
    return NextResponse.json(
      { error: "Error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orderRef = db.collection("productOrders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: `Product order not found: ${orderId}` },
        { status: 404 },
      );
    }

    await orderRef.update({ status: ProductOrderStatus.PAID });

    const orderData = orderDoc.data();

    // Redeem coupon on successful payment
    if (orderData?.couponId) {
      const couponRef = db.collection("coupons").doc(orderData.couponId);
      const couponDoc = await couponRef.get();

      if (couponDoc.exists) {
        const coupon = couponDoc.data() as Coupon;
        const newUsageCount = coupon.usageCount + 1;
        const newDiscountImpact =
          coupon.discountImpact + (orderData.discountAmount ?? 0);
        const newRevenueImpact = coupon.revenueImpact + (orderData.price ?? 0);

        const couponUpdate: Record<string, unknown> = {
          usageCount: newUsageCount,
          discountImpact: newDiscountImpact,
          revenueImpact: newRevenueImpact,
          updatedAt: new Date().toISOString(),
        };

        if (coupon.usageLimit !== null && newUsageCount >= coupon.usageLimit) {
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

    // Update digitalProduct totalSales and purchaseCount
    const productId = orderData?.productId;
    const userId = orderData?.userId;
    if (productId) {
      const productRef = db.collection("digitalProducts").doc(productId);
      await productRef.update({
        totalSales: FieldValue.increment(orderData?.price ?? 0),
        purchaseCount: FieldValue.increment(1),
      });
    }

    // Insert purchase record in users/{userId}/purchases/{productId}
    if (userId && productId) {
      await db
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc(productId)
        .set({ orderId }, { merge: true });
    }

    // TODO: Send product order confirmation email when implemented

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Product checkout PUT error:", error);
    return NextResponse.json(
      { error: "Error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
