import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { Ticket } from "@/src/models/ticket";
import { AppUser, CustomerResponse } from "@/src/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Query users with pagination
    let usersQuery = db.collection("users");

    const usersSnapshot = await usersQuery.get();

    // Fetch tickets in a single batch query
    const userIds = usersSnapshot.docs.map((doc) => doc.id);
    const ticketsSnapshot = await db
      .collection("tickets")
      .where("userId", "in", userIds)
      .get();

    const ticketsMap = ticketsSnapshot.docs.reduce(
      (acc, doc) => {
        const ticket = doc.data() as Ticket;
        if (!acc[ticket.userId]) acc[ticket.userId] = [];
        acc[ticket.userId].push(ticket);
        return acc;
      },
      {} as Record<string, Ticket[]>
    );

    // Map users to customers
    const customers: CustomerResponse[] = usersSnapshot.docs.map((doc) => {
      const userData = doc.data() as AppUser;
      const userId = doc.id;
      return { user: userData, tickets: ticketsMap[userId] || [] };
    });

    return new NextResponse(JSON.stringify({ customers }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
