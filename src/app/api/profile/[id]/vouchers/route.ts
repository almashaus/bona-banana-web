import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { Coupon } from "@/src/models/coupon";
import { computeStatus } from "@/src/lib/utils/couponValidation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = params;

    // Caller must be the same user (or admin)
    if (decodedToken.uid !== userId && !decodedToken.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await db
      .collection("coupons")
      .where("assignedUserId", "==", userId)
      .where("type", "==", "Voucher")
      .get();

    // Collect all unique event IDs referenced by these vouchers
    const allEventIds = [
      ...new Set(
        snapshot.docs.flatMap((doc) => (doc.data() as Coupon).applicableEvents ?? []),
      ),
    ];

    // Batch-fetch event documents (Firestore `in` supports up to 30 ids per query)
    const eventNameMap: Record<string, { en: string; ar: string }> = {};
    for (let i = 0; i < allEventIds.length; i += 30) {
      const chunk = allEventIds.slice(i, i + 30);
      const eventsSnap = await db
        .collection("events")
        .where("__name__", "in", chunk)
        .get();
      eventsSnap.docs.forEach((d) => {
        eventNameMap[d.id] = {
          en: d.data().title ?? "",
          ar: d.data().titleAr ?? d.data().title ?? "",
        };
      });
    }

    const vouchers = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const coupon = doc.data() as Coupon;

        let remainingBalance: number | undefined;
        if (coupon.allowPartialConsumption) {
          const balDoc = await db
            .collection("voucherBalances")
            .doc(`${coupon.id}_${userId}`)
            .get();
          remainingBalance = balDoc.exists
            ? (balDoc.data()?.remainingBalance ?? coupon.discountValue)
            : coupon.discountValue;
        }

        let userUsageCount: number | undefined;
        if (coupon.perUserLimit != null) {
          const usageSnap = await db
            .collection("orders")
            .where("userId", "==", userId)
            .where("couponId", "==", coupon.id)
            .where("status", "==", "Paid")
            .get();
          userUsageCount = usageSnap.size;
        }

        const applicableEventNames = (coupon.applicableEvents ?? []).map(
          (eventId) => ({ id: eventId, ...( eventNameMap[eventId] ?? { en: eventId, ar: eventId }) }),
        );

        return {
          coupon,
          remainingBalance,
          userUsageCount,
          applicableEventNames,
        };
      }),
    );

    return NextResponse.json({ vouchers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

/**
 * POST /api/profile/[id]/vouchers
 * Body: { code: string }
 *
 * Finds a Voucher coupon by code and assigns it to this user,
 * provided it is not already assigned to a different user.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = params;

    if (decodedToken.uid !== userId && !decodedToken.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { code } = await req.json();

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "missingCode" },
        { status: 400 },
      );
    }

    const normalizedCode = String(code).toUpperCase().trim();

    const snapshot = await db
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .where("type", "==", "Voucher")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "voucherNotFound" },
        { status: 404 },
      );
    }

    const docRef = snapshot.docs[0].ref;
    const coupon = snapshot.docs[0].data() as Coupon;

    // Already assigned to this user — nothing to do
    if (coupon.assignedUserId === userId) {
      return NextResponse.json(
        { error: "alreadyYours" },
        { status: 409 },
      );
    }

    // Assigned to a different user — not claimable
    if (coupon.assignedUserId && coupon.assignedUserId !== userId) {
      return NextResponse.json(
        { error: "voucherNotFound" },
        { status: 404 },
      );
    }

    // Voucher must be active (not expired / disabled / fully redeemed)
    const status = computeStatus(coupon);
    if (status !== "Active" && status !== "Scheduled") {
      return NextResponse.json(
        { error: "voucherInactiveOrExpired" },
        { status: 400 },
      );
    }

    // Assign to this user
    await docRef.update({
      assignedUserId: userId,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
