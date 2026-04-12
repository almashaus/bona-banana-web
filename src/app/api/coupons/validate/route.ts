import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Coupon } from "@/src/models/coupon";
import {
  validateCoupon,
  CouponValidationContext,
} from "@/src/lib/utils/couponValidation";
import { roundMoney } from "@/src/lib/utils/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { couponCode, eventId, ticketQuantity, cartSubtotal, userId } = body;

    if (!couponCode || !eventId || !ticketQuantity || cartSubtotal == null) {
      return NextResponse.json(
        { valid: false, errorMessage: "missingRequiredFields" },
        { status: 400 },
      );
    }

    const normalizedCode = String(couponCode).toUpperCase().trim();

    const snapshot = await db
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        valid: false,
        errorMessage: "couponInvalid",
      });
    }

    const coupon = snapshot.docs[0].data() as Coupon;

    // Early assignedUserId check
    if (coupon.assignedUserId && coupon.assignedUserId !== userId) {
      return NextResponse.json({
        valid: false,
        errorMessage: "couponInvalidOrExpired",
      });
    }

    let userUsageCount = 0;
    if (userId && coupon.perUserLimit != null) {
      const usageSnap = await db
        .collection("orders")
        .where("userId", "==", userId)
        .where("couponId", "==", coupon.id)
        .where("status", "==", "Paid")
        .get();
      userUsageCount = usageSnap.size;
    }

    // Fetch remaining balance for partial consumption vouchers
    let remainingBalance: number | undefined;
    if (coupon.type === "Voucher" && coupon.allowPartialConsumption && userId) {
      const balDoc = await db
        .collection("voucherBalances")
        .doc(`${coupon.id}_${userId}`)
        .get();
      remainingBalance = balDoc.exists
        ? (balDoc.data()?.remainingBalance ?? coupon.discountValue)
        : coupon.discountValue;
    }

    const ctx: CouponValidationContext = {
      cartTotal: cartSubtotal,
      ticketQuantity,
      eventIds: [eventId],
      userId,
      userUsageCount,
    };

    const result = validateCoupon(coupon, ctx, {
      voucherRemainingBalance: remainingBalance,
    });

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        errorMessage: result.error,
      });
    }

    const discountAmount = roundMoney(result.discountAmount ?? 0);
    const isBuyXGetY =
      coupon.type === "Offer" && coupon.offerSubtype === "buyXgetY";

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount,
      discountType: isBuyXGetY ? "buyXgetY" : coupon.discountKind,
      updatedCartTotal: roundMoney(cartSubtotal - discountAmount),
      ...(remainingBalance !== undefined && { remainingBalance }),
      couponDetails: {
        type: coupon.type,
        discountKind: coupon.discountKind,
        discountValue: coupon.discountValue,
        maxCap: coupon.maxCap,
        minTicketValue: coupon.minTicketValue,
        offerSubtype: coupon.offerSubtype ?? null,
        buyQuantity: coupon.buyQuantity ?? null,
        getQuantity: coupon.getQuantity ?? null,
        voucherKind: coupon.voucherKind ?? null,
        allowPartialConsumption: coupon.allowPartialConsumption ?? false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, errorMessage: "serverErrorDuringValidation" },
      { status: 500 },
    );
  }
}
