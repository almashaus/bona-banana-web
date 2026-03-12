import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { AppUser } from "@/src/models/user";
import { NextRequest, NextResponse } from "next/server";

export interface CouponUsageRow {
  name: string;
  email: string;
  orderId: string;
  discountAmount: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = _req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: couponId } = await params;

    if (!couponId) {
      return NextResponse.json(
        { error: "Missing coupon id" },
        { status: 400 },
      );
    }

    const usagesSnapshot = await db
      .collection("couponUsages")
      .where("couponId", "==", couponId)
      .get();

    const sortedDocs = usagesSnapshot.docs.sort((a, b) => {
      const aTs = a.data().timestamp ?? "";
      const bTs = b.data().timestamp ?? "";
      return new Date(bTs).getTime() - new Date(aTs).getTime();
    });

    const usages: CouponUsageRow[] = await Promise.all(
      sortedDocs.map(async (doc) => {
        const data = doc.data();
        const userId = data.userId ?? "";
        const orderId = data.orderId ?? "";
        const discountAmount = data.discountAmount ?? 0;

        let name = "Unknown";
        let email = "-";

        if (userId) {
          const userDoc = await db.collection("users").doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data() as AppUser;
            name = userData?.name ?? "Unknown";
            email = userData?.email ?? "-";
          }
        }

        return { name, email, orderId, discountAmount };
      }),
    );

    return NextResponse.json({ usages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching coupon usages:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon usages" },
      { status: 500 },
    );
  }
}
