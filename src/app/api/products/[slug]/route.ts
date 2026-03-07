import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { DigitalProduct, DigitalProductStatus } from "@/src/models/digitalProduct";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    const snapshot = await db
      .collection("digitalProducts")
      .where("slug", "==", slug)
      .where("status", "==", DigitalProductStatus.PUBLISHED)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productData = snapshot.docs[0].data() as DigitalProduct;

    return NextResponse.json(productData, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
