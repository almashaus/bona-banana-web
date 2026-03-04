import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Coupon } from "@/src/models/coupon";
import { computeStatus } from "@/src/lib/utils/couponValidation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ offer: null });
    }

    const snapshot = await db
      .collection("coupons")
      .where("type", "==", "Offer")
      .where("autoApply", "==", true)
      .get();

    for (const doc of snapshot.docs) {
      const coupon = doc.data() as Coupon;
      if (computeStatus(coupon) !== "Active") continue;

      const applicable =
        coupon.applicableEvents.length === 0 ||
        coupon.applicableEvents.includes(eventId);
      if (!applicable) continue;

      return NextResponse.json({
        offer: {
          id: coupon.id,
          type: coupon.type,
          discountKind: coupon.discountKind,
          discountValue: coupon.discountValue,
          maxCap: coupon.maxCap,
          minTicketValue: coupon.minTicketValue,
          offerSubtype: coupon.offerSubtype ?? null,
          buyQuantity: coupon.buyQuantity ?? null,
          getQuantity: coupon.getQuantity ?? null,
          description: coupon.description,
        },
      });
    }

    return NextResponse.json({ offer: null });
  } catch {
    return NextResponse.json({ offer: null }, { status: 500 });
  }
}
