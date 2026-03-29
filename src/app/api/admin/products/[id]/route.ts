import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { getFileName } from "@/src/lib/utils/utils";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { NextRequest, NextResponse } from "next/server";
import { renameFile } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await db.collection("digitalProducts").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ...doc.data(), id: doc.id } as DigitalProduct, {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { product } = body;

    if (product.coverImage) {
      const fileName = getFileName(product.coverImage);
      if (fileName) {
        await renameFile(
          `products/${product.slug}/images/${fileName}`,
          `products/${product.id}/images/${fileName}`,
        );
        product.coverImage = product.coverImage.replace(
          product.slug,
          product.id,
        );
      }
    }

    if (product.images && product.images.length > 0) {
      const updatedImages: string[] = [];
      for (const imageUrl of product.images) {
        const fileName = getFileName(imageUrl);
        if (fileName) {
          await renameFile(
            `products/${product.slug}/images/${fileName}`,
            `products/${product.id}/images/${fileName}`,
          );
          updatedImages.push(imageUrl.replace(product.slug, product.id));
        } else {
          updatedImages.push(imageUrl);
        }
      }
      product.images = updatedImages;
    }

    if (product.downloadableFile?.fileName) {
      const fileName = product.downloadableFile.fileName;

      await renameFile(
        `products/${product.slug}/${fileName}`,
        `products/${product.id}/${fileName}`,
      );
      product.downloadableFile = {
        ...product.downloadableFile,
        filePath: product.downloadableFile.filePath.replace(
          product.slug,
          product.id,
        ),
      };
    }

    await db
      .collection("digitalProducts")
      .doc(id)
      .update({
        ...product,
      });

    return NextResponse.json({ data: "Success" }, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, updatedAt } = body;

    await db.collection("digitalProducts").doc(id).update({
      status,
      updatedAt,
    });

    return NextResponse.json({ data: "Success" }, { status: 200 });
  } catch (error) {
    console.error("Error updating product status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { updatedAt } = body;

    await db
      .collection("digitalProducts")
      .doc(id)
      .update({ status: "deleted", updatedAt });
    return NextResponse.json({ data: "Success" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
