import { Readable } from "stream";
import { db, storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { DigitalProduct } from "@/src/models/digitalProduct";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  const authHeader = req.headers.get("Authorization") || "";

  const decodedToken = await verifyIdToken(authHeader);
  if (!decodedToken) {
    return new Response(JSON.stringify({ data: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!productId) {
    return new Response("Product ID is required", { status: 400 });
  }

  const purchase = await db
    .collection("users")
    .doc(decodedToken.uid)
    .collection("purchases")
    .doc(productId!)
    .get();

  if (!purchase.exists) {
    return new Response("Unauthorized", { status: 403 });
  }

  const product = await db.collection("digitalProducts").doc(productId!).get();

  if (!product.exists) {
    return new Response("Product not found", { status: 404 });
  }

  const productData = product.data() as DigitalProduct;

  const bucket = storage.bucket();
  const file = bucket.file(productData.downloadableFile?.fileUrl ?? "");
  const [metadata] = await file.getMetadata();
  const contentLength = Number(metadata.size ?? 0);

  const nodeStream = file.createReadStream();
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${productData.downloadableFile?.fileName}`,
      "Content-Length": contentLength.toString(),
    },
    status: 200,
  });
}
