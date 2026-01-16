import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MF_BASE = process.env.MF_BASE_URL!;
const MF_TOKEN = process.env.MF_API_TOKEN!;

if (!MF_BASE || !MF_TOKEN) {
  throw new Error("Missing MyFatoorah environment variables.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceAmount = Number(body.invoiceAmount);
    const currencyIso = String(body.currencyIso || "SAR");

    if (!invoiceAmount || invoiceAmount <= 0) {
      return NextResponse.json(
        { data: { error: "Invalid invoice amount" } },
        { status: 400 }
      );
    }

    const payload = {
      InvoiceAmount: invoiceAmount,
      CurrencyIso: currencyIso,
    };

    const res = await fetch(`${MF_BASE}/v2/InitiatePayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MyFatoorah InitiatePayment error", data);
      return NextResponse.json(
        { data: { error: "Payment gateway error" } },
        { status: 502 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("InitiatePayment handler error", err);
    return NextResponse.json(
      { data: { error: "Server error" } },
      { status: 500 }
    );
  }
}
