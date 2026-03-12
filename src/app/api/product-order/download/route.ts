import { Readable } from "stream";
import { db, storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProductOrderBuyer } from "@/src/models/productOrder";
import { AppUser } from "@/src/models/user";

export async function GET(req: Request) {
  try {
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

    const user = await db.collection("users").doc(decodedToken.uid).get();

    const userData = user.data();

    const product = await db
      .collection("digitalProducts")
      .doc(productId!)
      .get();

    if (!product.exists) {
      return new Response("Product not found", { status: 404 });
    }

    const productData = product.data() as DigitalProduct;

    const bucket = storage.bucket();
    const file = bucket.file(productData.downloadableFile?.fileUrl ?? "");
    // const [metadata] = await file.getMetadata();
    // const contentLength = Number(metadata.size ?? 0);

    // const nodeStream = file.createReadStream();
    // const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    const [buffer] = await file.download();

    const pdfDoc = await PDFDocument.load(buffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const userName = userData?.name ?? "";
    const fontSize = 9;

    for (const page of pages) {
      const { width } = page.getSize();
      const textWidth = font.widthOfTextAtSize(userName, fontSize);
      const x = (width - textWidth) / 2;

      // Add name at center bottom of each page
      page.drawText(userName, {
        x,
        y: 22,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const watermarkedPdf = await pdfDoc.save();
    const pdfBuffer = Buffer.from(watermarkedPdf);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${productData.downloadableFile?.fileName}`,
        "Content-Length": pdfBuffer.length.toString(),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Product order download error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to download product" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
