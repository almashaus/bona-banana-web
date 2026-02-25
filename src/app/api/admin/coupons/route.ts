import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Coupon } from "@/src/models/coupon";
import { Event } from "@/src/models/event";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const eventsSnapshot = await db
      .collection("events")
      .orderBy("updatedAt", "desc")
      .get();

    const events = eventsSnapshot.docs.map((doc) => doc.data() as Event);

    const couponsSnapshot = await db
      .collection("coupons")
      .orderBy("updatedAt", "desc")
      .get();

    const coupons = couponsSnapshot.docs.map((doc) => doc.data() as Coupon);

    return NextResponse.json(
      { events, coupons },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ data: "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ data: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { coupon } = body;

    if (!coupon) {
      return NextResponse.json(
        { data: "Missing coupon in request body" },
        { status: 400 }
      );
    }

    const docRef = db.collection("coupons").doc();
    const now = new Date().toISOString();

    const couponData: Coupon = {
      id: docRef.id,
      code: coupon.code ?? "",
      type: coupon.type ?? "Discount",
      discountKind: coupon.discountKind ?? "percentage",
      discountValue: coupon.discountValue ?? 0,
      maxCap: coupon.maxCap ?? null,
      minTicketValue: coupon.minTicketValue ?? null,
      applicableEvents: coupon.applicableEvents ?? [],
      usageLimit: coupon.usageLimit ?? null,
      perUserLimit: coupon.perUserLimit ?? null,
      usageCount: coupon.usageCount ?? 0,
      revenueImpact: coupon.revenueImpact ?? 0,
      discountImpact: coupon.discountImpact ?? 0,
      startDate: coupon.startDate ?? now,
      endDate: coupon.endDate ?? now,
      status: coupon.status ?? "Active",
      description: coupon.description ?? "",
      createdAt: coupon.createdAt ?? now,
      updatedAt: now,
      ...(coupon.allowPartialConsumption !== undefined && {
        allowPartialConsumption: coupon.allowPartialConsumption,
      }),
      ...(coupon.autoApply !== undefined && { autoApply: coupon.autoApply }),
      ...(coupon.offerSubtype && { offerSubtype: coupon.offerSubtype }),
      ...(coupon.buyQuantity != null && { buyQuantity: coupon.buyQuantity }),
      ...(coupon.getQuantity != null && { getQuantity: coupon.getQuantity }),
    };

    await docRef.set(couponData);

    return NextResponse.json(
      { data: "Success", id: docRef.id, coupon: couponData },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/coupons:", error);
    return NextResponse.json({ data: "Error" }, { status: 500 });
  }
}
