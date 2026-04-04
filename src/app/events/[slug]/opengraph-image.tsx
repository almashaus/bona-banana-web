import { ImageResponse } from "next/og";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";

export const runtime = "nodejs";
export const alt = "Event on Bona Banana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const snapshot = await db
    .collection("events")
    .where("slug", "==", params.slug)
    .limit(1)
    .get();

  const event = snapshot.empty ? null : snapshot.docs[0].data();
  const title = event?.title ?? "Bona Banana Event";
  const city = event?.city ?? "";
  const price = event?.price != null ? `${event.price} SAR` : "";

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        padding: "60px",
        gap: "24px",
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {city && (
        <div style={{ fontSize: 28, opacity: 0.8, textAlign: "center" }}>
          {city}
        </div>
      )}
      {price && (
        <div
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#f9ca24",
            marginTop: 8,
          }}
        >
          {price}
        </div>
      )}
      <div style={{ fontSize: 22, opacity: 0.6, marginTop: 16 }}>
        Book your tickets — Bona Banana
      </div>
    </div>,
    { ...size },
  );
}
