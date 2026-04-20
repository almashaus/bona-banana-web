import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@/src/models/campaign/campaign";

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } },
) {
  try {
    const { campaignId } = params;

    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const campaign = { id: campaignDoc.id, ...campaignDoc.data() };

    // Fetch subcollections in parallel
    const [playersSnap, sessionsSnap, bookingsSnap] = await Promise.all([
      db
        .collection("campaigns")
        .doc(campaignId)
        .collection("players")
        .get(),
      db
        .collection("campaigns")
        .doc(campaignId)
        .collection("sessions")
        .orderBy("sessionNumber", "asc")
        .get(),
      db
        .collection("campaigns")
        .doc(campaignId)
        .collection("bookings")
        .get(),
    ]);

    const players = playersSnap.docs.map((d) => d.data());
    const sessions = sessionsSnap.docs.map((d) => d.data());
    const bookings = bookingsSnap.docs.map((d) => d.data());

    return NextResponse.json(
      { ...campaign, players, sessions, bookings },
      { status: 200 },
    );
  } catch (error) {
    console.error("Campaign GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { campaignId: string } },
) {
  try {
    const decoded = await verifyIdToken(
      req.headers.get("Authorization") ?? "",
    );
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = params;
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const campaign = campaignDoc.data();
    if (campaign?.masterId !== decoded.uid) {
      return NextResponse.json(
        { error: "Only the campaign master can edit" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const now = new Date().toISOString();

    // Update campaign fields
    const updateData: Record<string, unknown> = { updatedAt: now };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.sessionsCount !== undefined)
      updateData.sessionsCount = body.sessionsCount;
    if (body.playersCount !== undefined)
      updateData.playersCount = body.playersCount;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;

    await db.collection("campaigns").doc(campaignId).update(updateData);

    // Handle player updates if provided
    if (body.addPlayers && Array.isArray(body.addPlayers)) {
      const batch = db.batch();
      for (const player of body.addPlayers) {
        const playerId = `${campaignId}_P${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const playerRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("players")
          .doc(playerId);
        batch.set(playerRef, {
          id: playerId,
          campaignId,
          name: player.name,
          isActive: true,
          createdAt: now,
        });
      }
      await batch.commit();
    }

    if (body.removePlayers && Array.isArray(body.removePlayers)) {
      const batch = db.batch();
      for (const playerId of body.removePlayers) {
        const playerRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("players")
          .doc(playerId);
        batch.delete(playerRef);
      }
      await batch.commit();
    }

    if (body.deactivatePlayers && Array.isArray(body.deactivatePlayers)) {
      const batch = db.batch();
      for (const playerId of body.deactivatePlayers) {
        const playerRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("players")
          .doc(playerId);
        batch.update(playerRef, { isActive: false });
      }
      await batch.commit();
    }

    // Handle session updates if provided
    if (body.updateSessions && Array.isArray(body.updateSessions)) {
      const batch = db.batch();
      for (const session of body.updateSessions) {
        const sessionRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("sessions")
          .doc(session.id);
        batch.update(sessionRef, { dateTime: session.dateTime });
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Campaign PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { campaignId: string } },
) {
  try {
    const decoded = await verifyIdToken(
      req.headers.get("Authorization") ?? "",
    );
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = params;
    const body = await req.json();
    const { action } = body;

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      await campaignRef.update({
        status: CampaignStatus.PUBLISHED,
        approvedBy: decoded.uid,
        approvedAt: now,
        updatedAt: now,
      });
      return NextResponse.json({ success: true, status: "Published" });
    }

    if (action === "reject") {
      await campaignRef.update({
        status: CampaignStatus.REJECTED,
        updatedAt: now,
      });
      return NextResponse.json({ success: true, status: "Rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Campaign PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign status" },
      { status: 500 },
    );
  }
}
