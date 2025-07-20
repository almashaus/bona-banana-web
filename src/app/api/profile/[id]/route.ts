import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { getDocumentById } from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { formatEventsDates } from "@/src/lib/utils/formatDate";
import { Ticket } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user";
import { Timestamp } from "firebase/firestore";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    const user = await getDocumentById("users", id);

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("userId", "==", id)
      .get();

    const ticketsData = await Promise.all(
      ticketsSnapshot.docs.map(async (docData) => {
        const ticketData = docData.data() as Ticket;

        // Get event for this order
        let eventData = null;
        if (ticketData.eventId) {
          const eventDoc = await db
            .collection("events")
            .doc(ticketData.eventId)
            .get();
          eventData = eventDoc.exists ? eventDoc.data() : null;
        }

        const event = eventData && formatEventsDates(eventData, true);

        return {
          event: event,
          date: event?.dates.find((d) => d.id === ticketData.eventDateId)?.date,
          ticket: ticketData,
        };
      })
    );

    if (user) {
      let theUser: AppUser | any = user;
      if (user.dashboard) {
        theUser = {
          ...user,
          dashboard: {
            ...user?.dashboard,
            joinedDate: (user?.dashboard?.joinedDate as Timestamp).toDate(),
          },
        };
      }

      return new Response(
        JSON.stringify({ appUser: theUser, tickets: ticketsData }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(JSON.stringify({ data: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.log(`##### ${error}`);
    return new Response(JSON.stringify({ data: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";

    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken) {
      return new Response(JSON.stringify({ data: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { id, data } = body;

    let user = data;
    if (data.hasDashboardAccess) {
      user = {
        ...data,
        dashboard: {
          ...data.dashboard,
          joinedDate: new Date(data.dashboard.joinedDate),
        },
      };
    }

    await db.collection("users").doc(id).update(user);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
