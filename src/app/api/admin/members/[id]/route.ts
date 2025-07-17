import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { getDocumentById } from "@/src/lib/firebase/firestore";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { AppUser } from "@/src/models/user";
import { Timestamp } from "firebase/firestore";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const memberData = await getDocumentById("users", id);

    const member: AppUser | any = {
      ...memberData,
      dashboard: {
        ...memberData?.dashboard,
        joinedDate: (memberData?.dashboard?.joinedDate as Timestamp).toDate(),
      },
    };

    return new Response(JSON.stringify(member), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
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

    if (!decodedToken || !decodedToken.admin) {
      return new Response(JSON.stringify({ data: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { id, data } = body;

    const joinedDate = data.dashboard.joinedDate;

    const member = {
      ...data,
      dashboard: {
        ...data.dashboard,
        joinedDate: new Date(
          joinedDate?.seconds ? new Date(joinedDate.seconds * 1000) : joinedDate
        ),
      },
    };

    await db.collection("users").doc(id).update(member);

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
