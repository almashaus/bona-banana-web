import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { ProductCategory } from "@/src/models/digitalProduct";
import { NextRequest, NextResponse } from "next/server";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .replace(/ +/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, nameAr, slug, image } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const categoryData: Omit<ProductCategory, "id"> = {
      name: name.trim(),
      nameAr: (nameAr ?? "").trim(),
      slug: (slug ?? generateSlug(name)).trim() || generateSlug(name),
      ...(image ? { image } : {}),
    };

    const docRef = await db.collection("productCategories").add(categoryData);

    return NextResponse.json(
      { data: "Success", id: docRef.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
