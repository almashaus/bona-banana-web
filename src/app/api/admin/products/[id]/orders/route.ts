import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { ProductOrder, ProductOrderBuyer } from "@/src/models/productOrder";
import { AppUser } from "@/src/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    const ordersSnapshot = await db
      .collection("productOrders")
      .where("productId", "==", productId)
      .get();

    const sortedDocs = ordersSnapshot.docs.sort((a, b) => {
      const aDate = a.data().orderDate?.toDate?.() ?? a.data().orderDate ?? 0;
      const bDate = b.data().orderDate?.toDate?.() ?? b.data().orderDate ?? 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const buyers: ProductOrderBuyer[] = await Promise.all(
      sortedDocs.map(async (doc) => {
        const orderData = doc.data();
        const order: ProductOrder = {
          id: doc.id,
          productId: orderData.productId,
          userId: orderData.userId,
          price: orderData.price ?? 0,
          orderDate: orderData.orderDate?.toDate?.() ?? orderData.orderDate,
          status: orderData.status,
          paymentMethod: orderData.paymentMethod,
        };

        let userName = "Unknown";
        let userEmail = "-";
        let userPhone: string | undefined;

        if (orderData.userId) {
          const userDoc = await db
            .collection("users")
            .doc(orderData.userId)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data() as AppUser;
            userName = userData?.name ?? "Unknown";
            userEmail = userData?.email ?? "-";
            userPhone = userData?.phone;
          }
        }

        return {
          order,
          userName,
          userEmail,
          userPhone,
        };
      }),
    );

    return NextResponse.json({ buyers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch product orders" },
      { status: 500 },
    );
  }
}
