import { db, storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import {
  DigitalProduct,
  DigitalProductStatus,
} from "@/src/models/digitalProduct";
import { getFileName } from "@/src/lib/utils/utils";
import { NextRequest, NextResponse } from "next/server";

async function renameFile(oldPath: string, newPath: string) {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(oldPath);
  const [exists] = await file.exists();
  if (!exists) return;
  await file.copy(bucket.file(newPath));
  await file.delete();
}

export async function GET() {
  try {
    const snapshot = await db
      .collection("digitalProducts")
      .orderBy("updatedAt", "desc")
      .get();

    const products = snapshot.docs.map((doc) => ({
      ...(doc.data() as DigitalProduct),
      id: doc.id,
    }));

    const categoriesSnapshot = await db.collection("productCategories").get();
    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ products, categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { product } = body;

    const productData: DigitalProduct = {
      ...product,
      totalSales: 0,
      purchaseCount: 0,
    };

    const docRef = db.collection("digitalProducts").doc();

    if (productData.coverImage) {
      const fileName = getFileName(productData.coverImage);
      if (fileName) {
        await renameFile(
          `products/${productData.slug}/images/${fileName}`,
          `products/${docRef.id}/images/${fileName}`,
        );
        productData.coverImage = productData.coverImage.replace(
          productData.slug,
          docRef.id,
        );
      }
    }

    if (productData.images && productData.images.length > 0) {
      const updatedImages: string[] = [];
      for (const imageUrl of productData.images) {
        const fileName = getFileName(imageUrl);
        if (fileName) {
          await renameFile(
            `products/${productData.slug}/images/${fileName}`,
            `products/${docRef.id}/images/${fileName}`,
          );
          updatedImages.push(imageUrl.replace(productData.slug, docRef.id));
        } else {
          updatedImages.push(imageUrl);
        }
      }
      productData.images = updatedImages;
    }

    if (productData.downloadableFile?.fileName) {
      const fileName = productData.downloadableFile.fileName;

      await renameFile(
        `products/${productData.slug}/${fileName}`,
        `products/${docRef.id}/${fileName}`,
      );
      productData.downloadableFile = {
        ...productData.downloadableFile,
        fileUrl: productData.downloadableFile.fileUrl.replace(
          productData.slug,
          docRef.id,
        ),
      };
    }

    await docRef.set({ ...productData, id: docRef.id });

    return NextResponse.json(
      { data: "Success", id: docRef.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
