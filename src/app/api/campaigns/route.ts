import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";
import { campaignFormSchema } from "@/src/models/campaign/campaignSchemas";
import { CampaignStatus } from "@/src/models/campaign/campaign";
import { generateIDNumber } from "@/src/lib/utils/utils";

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(
      req.headers.get("Authorization") ?? "",
    );
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = campaignFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const campaignId = generateIDNumber("CAMPAIGN");
    const now = new Date().toISOString();

    // Create campaign document
    await db
      .collection("campaigns")
      .doc(campaignId)
      .set({
        id: campaignId,
        title: data.title,
        masterId: decoded.uid,
        status: CampaignStatus.PENDING,
        sessionsCount: data.sessionsCount,
        playersCount: data.playersCount,
        price: data.price,
        city: data.city,
        startDate: data.startDate,
        createdAt: now,
        updatedAt: now,
      });

    // Create player subcollection docs
    const playerPromises = data.playerNames.map((name, index) => {
      const playerId = `${campaignId}_P${index + 1}`;
      return db
        .collection("campaigns")
        .doc(campaignId)
        .collection("players")
        .doc(playerId)
        .set({
          id: playerId,
          campaignId,
          name,
          isActive: true,
          createdAt: now,
        });
    });

    // Create session subcollection docs
    const sessionPromises = data.sessionDates.map((dateTime, index) => {
      const sessionId = `${campaignId}_S${index + 1}`;
      return db
        .collection("campaigns")
        .doc(campaignId)
        .collection("sessions")
        .doc(sessionId)
        .set({
          id: sessionId,
          campaignId,
          sessionNumber: index + 1,
          dateTime,
          createdAt: now,
        });
    });

    await Promise.all([...playerPromises, ...sessionPromises]);

    return NextResponse.json(
      { success: true, campaignId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Campaign POST error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const masterId = searchParams.get("masterId");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    let query: FirebaseFirestore.Query = db.collection("campaigns");

    if (masterId) {
      query = query.where("masterId", "==", masterId);
    }

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();

    const campaigns = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const campaign = { id: doc.id, ...doc.data() };

        // Fetch players subcollection
        const playersSnap = await db
          .collection("campaigns")
          .doc(doc.id)
          .collection("players")
          .get();
        const players = playersSnap.docs.map((p) => p.data());

        // Fetch sessions subcollection
        const sessionsSnap = await db
          .collection("campaigns")
          .doc(doc.id)
          .collection("sessions")
          .orderBy("sessionNumber", "asc")
          .get();
        const sessions = sessionsSnap.docs.map((s) => s.data());

        return { ...campaign, players, sessions };
      }),
    );

    // If userId is provided, filter to campaigns the user has joined (has bookings)
    if (userId) {
      const joinedCampaignIds: string[] = [];

      for (const campaign of campaigns) {
        const bookingsSnap = await db
          .collection("campaigns")
          .doc(campaign.id)
          .collection("bookings")
          .where("userId", "==", userId)
          .limit(1)
          .get();

        if (!bookingsSnap.empty) {
          joinedCampaignIds.push(campaign.id);
        }
      }

      const joinedCampaigns = campaigns.filter((c) =>
        joinedCampaignIds.includes(c.id),
      );
      return NextResponse.json({ campaigns: joinedCampaigns }, { status: 200 });
    }

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error("Campaign GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}
