import { storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { getDocumentById } from "@/src/lib/firebase/firestore";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { ProductOrder } from "@/src/models/productOrder";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber) {
      return new Response(JSON.stringify({ error: "Missing orderNumber" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderData = await getDocumentById("productOrders", orderNumber);

    if (!orderData) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const order = orderData as ProductOrder;
    const product = (await getDocumentById(
      "digitalProducts",
      order.productId,
    )) as DigitalProduct;

    if (!order || !product) {
      return new Response(
        JSON.stringify({ error: "Order or product not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ order, product }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Product order API error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch order" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
