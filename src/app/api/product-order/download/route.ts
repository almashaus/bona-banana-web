import { Timestamp } from "firebase-admin/firestore";
import { db, storage } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProductOrderStatus } from "@/src/models/productOrder";

/** Max file size (50MB) - prevents memory exhaustion for large files */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Rate limit: max downloads per user per window */
const RATE_LIMIT_MAX = 2;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/** Check and record rate limit. Returns true if allowed, false if rate limited. */
async function checkRateLimit(userId: string): Promise<{ allowed: boolean }> {
  const docRef = db.collection("downloadRateLimits").doc(userId);
  const now = Timestamp.now();
  const windowStart = Timestamp.fromMillis(
    now.toMillis() - RATE_LIMIT_WINDOW_MS,
  );

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(docRef);
    const attempts: Timestamp[] = (snap.data()?.attempts ?? []).filter(
      (t: Timestamp) => t.toMillis() >= windowStart.toMillis(),
    );

    if (attempts.length >= RATE_LIMIT_MAX) {
      return { allowed: false };
    }

    const updated = [...attempts, now];
    transaction.set(docRef, { attempts: updated, updatedAt: now });
    return { allowed: true };
  });

  return result;
}

/** Valid Firestore document ID pattern - alphanumeric, max 1500 chars */
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,1500}$/;

/** Sanitize storage path - reject path traversal and invalid chars */
function sanitizeStoragePath(path: string): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (trimmed.length === 0) return null;
  // Reject path traversal attempts
  if (trimmed.includes("..") || trimmed.startsWith("/")) return null;
  // Reject absolute URLs (gs://, https://)
  if (trimmed.startsWith("gs://") || trimmed.startsWith("http")) return null;
  return trimmed;
}

/** RFC 5987 safe filename for Content-Disposition */
function safeFilename(filename: string): string {
  const safe = filename.replace(/[^\w\s.-]/g, "_").trim() || "download.pdf";
  return `"${safe}"`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const authHeader = req.headers.get("Authorization") || "";

    const decodedToken = await verifyIdToken(authHeader);
    if (!decodedToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!productId || !VALID_ID_REGEX.test(productId)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing product ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const [userSnap, productSnap] = await Promise.all([
      db.collection("users").doc(decodedToken.uid).get(),
      db.collection("digitalProducts").doc(productId).get(),
    ]);

    if (!userSnap.exists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!productSnap.exists) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const productData = productSnap.data() as DigitalProduct;
    const userData = userSnap.data();

    // SECURITY: Verify user has a PAID order for this product
    const orderSnapshot = await db
      .collection("productOrders")
      .where("userId", "==", decodedToken.uid)
      .where("productId", "==", productId)
      .where("status", "==", ProductOrderStatus.PAID)
      .limit(1)
      .get();

    if (orderSnapshot.empty) {
      return new Response(
        JSON.stringify({
          error: "You do not have permission to download this product",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Rate limit: 2 downloads per user per minute
    const { allowed } = await checkRateLimit(decodedToken.uid);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many download requests. Please try again in a minute.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    const filePath = productData.downloadableFile?.filePath;
    const sanitizedPath = sanitizeStoragePath(filePath ?? "");

    if (!sanitizedPath) {
      return new Response(
        JSON.stringify({ error: "Product file is not available" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const bucket = storage.bucket();
    const file = bucket.file(sanitizedPath);

    const [fileExists] = await file.exists();
    if (!fileExists) {
      return new Response(
        JSON.stringify({ error: "File not found in storage" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const [metadata] = await file.getMetadata();
    const fileSize = Number(metadata?.size ?? 0);
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: "File too large to process" }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }

    const [buffer] = await file.download();

    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(buffer);
    } catch (pdfError) {
      console.error("Invalid PDF file:", pdfError);
      return new Response(
        JSON.stringify({ error: "Invalid or corrupted file" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const userName = (userData?.name ?? "").slice(0, 200);

    for (const page of pages) {
      const { width } = page.getSize();
      const textWidth = font.widthOfTextAtSize(userName, 6);
      const x = Math.max(0, (width - textWidth) / 2);

      page.drawText(userName, {
        x,
        y: 22,
        size: 6,
        font,
        color: rgb(0.56, 0.53, 0.44),
      });
    }

    const watermarkedPdf = await pdfDoc.save();
    const pdfBuffer = Buffer.from(watermarkedPdf);
    const fileName = productData.downloadableFile?.fileName ?? "download.pdf";

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${safeFilename(fileName)}`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store",
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
