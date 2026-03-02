import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Fetch PDF from Firebase Storage
  const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/pdfs%2F${file}?alt=media`;

  try {
    const response = await fetch(firebaseUrl);
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; file="' + file + '"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }
}
