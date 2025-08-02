import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Ticket } from "@/src/models/ticket";
import { AppUser, CustomerResponse } from "@/src/models/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const usersSnapshot = await db.collection("users").get();

    const customers: CustomerResponse[] = await Promise.all(
      usersSnapshot.docs.map(async (docData) => {
        const userData = docData.data() as AppUser;
        const userId = docData.id;

        const ticketsSnapshot = await db
          .collection("tickets")
          .where("userId", "==", userId)
          .get();
        const ticketsData = ticketsSnapshot.docs.map(
          (doc) => doc.data() as Ticket
        );
        return { user: userData, tickets: ticketsData };
      })
    );

    return new NextResponse(JSON.stringify({ customers: customers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
