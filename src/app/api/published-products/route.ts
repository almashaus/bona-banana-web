import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import {
  DigitalProduct,
  ProductCategory,
  DigitalProductStatus,
} from "@/src/models/digitalProduct";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await db
      .collection("digitalProducts")
      .where("status", "==", DigitalProductStatus.PUBLISHED)
      .orderBy("updatedAt", "desc")
      .get();

    const products: DigitalProduct[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as DigitalProduct),
      id: doc.id,
    })) as DigitalProduct[];

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching published products:", error);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
