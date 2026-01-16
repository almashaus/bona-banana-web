import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, db } from "@/src/lib/firebase/firebaseAdminConfig";

type GalleryKeys = "image1" | "image2" | "image3" | "image4" | "image5";
type GalleryImages = Record<GalleryKeys, string>;
type PartialGalleryImages = Partial<GalleryImages>;

const SETTINGS_DOC_PATH = "settings/images"; // collection: settings, doc: images

function isGalleryKey(k: string): k is GalleryKeys {
  return (
    k === "image1" ||
    k === "image2" ||
    k === "image3" ||
    k === "image4" ||
    k === "image5"
  );
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Allows:
 * - https/http URLs (Firebase download URLs)
 * - absolute local path starting with "/"
 * Tighten if you want only Firebase URLs.
 */
function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/")) return true;

  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function requireAdmin() {
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    return {
      ok: false as const,
      status: 401 as const,
      message: "Missing session cookie",
    };
  }

  try {
    // checkRevoked = true is safer (handles revoked sessions)
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    // Your code style: claims.customClaims?.admin
    // In Firebase Admin JWT, custom claims appear directly on decoded token payload too,
    // but your existing logic uses customClaims, so we keep it consistent by loading user record:
    const user = await auth.getUser(decoded.uid);

    if (!user.customClaims?.admin) {
      return {
        ok: false as const,
        status: 403 as const,
        message: "Forbidden",
      };
    }

    return { ok: true as const, uid: decoded.uid };
  } catch {
    return {
      ok: false as const,
      status: 401 as const,
      message: "Invalid session",
    };
  }
}

/**
 * GET /api/admin/settings/images
 * Returns:
 * { images: { image1?: string, ... } }
 */
export async function GET() {
  //   const gate = await requireAdmin();
  //   if (!gate.ok) {
  //     return NextResponse.json(
  //       { error: gate.message },
  //       { status: gate.status, headers: { "Cache-Control": "no-store" } }
  //     );
  //   }

  const snapshot = await db.doc(SETTINGS_DOC_PATH).get();
  const data = snapshot.exists ? snapshot.data() : null;

  const images = (data?.images ?? {}) as PartialGalleryImages;

  return NextResponse.json(
    { images },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/admin/settings/images
 * Body:
 * { images: { image1?: string, ... } }
 *
 * - Partial updates allowed.
 */
export async function POST(req: NextRequest) {
  //   const gate = await requireAdmin();
  //   if (!gate.ok) {
  //     return NextResponse.json(
  //       { error: gate.message },
  //       { status: gate.status, headers: { "Cache-Control": "no-store" } }
  //     );
  //   }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const imagesObj = (body as any)?.images;
  if (!imagesObj || typeof imagesObj !== "object") {
    return NextResponse.json(
      { error: 'Body must be: { "images": { ... } }' },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const updates: PartialGalleryImages = {};

  for (const [key, value] of Object.entries(imagesObj)) {
    if (!isGalleryKey(key)) continue; // ignore extra keys silently

    // Optional: support clearing an image by sending empty string
    if (value === "") {
      updates[key] = "";
      continue;
    }

    if (!isNonEmptyString(value)) {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const url = value.trim();

    if (!isAllowedImageUrl(url)) {
      return NextResponse.json(
        { error: `URL not allowed for ${key}` },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    updates[key] = url;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid images provided" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  await db.doc(SETTINGS_DOC_PATH).set(
    {
      images: updates,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  const snap = await db.doc(SETTINGS_DOC_PATH).get();
  const data = snap.exists ? snap.data() : null;

  return NextResponse.json(
    { images: (data?.images ?? {}) as PartialGalleryImages },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
