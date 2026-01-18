import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MF_BASE = process.env.MF_BASE_URL!;
const MF_TOKEN = process.env.MF_API_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

if (!MF_BASE || !MF_TOKEN || !BASE_URL) {
  throw new Error("Missing required vars");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paymentMethodId,
      invoiceValue,
      customerName,
      customerEmail,
      customerReference,
      orderId,
    } = body;

    if (!paymentMethodId || !invoiceValue || Number(invoiceValue) <= 0) {
      return NextResponse.json(
        { data: { error: "Invalid payload" } },
        { status: 400 }
      );
    }

    // Callback URLs (MyFatoorah will append PaymentId)
    const callbackUrl = `${BASE_URL}/checkout/result?orderId=${encodeURIComponent(orderId || "")}`;
    const errorUrl = `${BASE_URL}/checkout/error?orderId=${encodeURIComponent(orderId || "")}`;

    const payload = {
      PaymentMethodId: paymentMethodId,
      InvoiceValue: invoiceValue,
      CurrencyIso: "SAR",
      CustomerName: customerName,
      CustomerEmail: customerEmail,
      CustomerReference: customerReference,
      CallBackUrl: callbackUrl,
      ErrorUrl: errorUrl,
    };

    const res = await fetch(`${MF_BASE}/v2/ExecutePayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("ExecutePayment error", data);
      return NextResponse.json(
        { data: { error: "Payment gateway error" } },
        { status: 502 }
      );
    }

    await db
      .collection("orders")
      .doc(orderId)
      .update({ invoiceId: data?.Data?.InvoiceId });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("ExecutePayment handler error", err);
    return NextResponse.json(
      { data: { error: "Server error" } },
      { status: 500 }
    );
  }
}
