import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@/src/models/campaign/campaign";
import {
  sendCampaignApprovalRequestEmail,
  sendCampaignApprovedEmail,
  sendCampaignRejectedEmail,
} from "@/src/lib/firebase/sendCampaignEmail";

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
      db.collection("campaigns").doc(campaignId).collection("players").get(),
      db
        .collection("campaigns")
        .doc(campaignId)
        .collection("sessions")
        .orderBy("sessionNumber", "asc")
        .get(),
      db.collection("campaigns").doc(campaignId).collection("bookings").get(),
    ]);

    const players = playersSnap.docs.map((d) => d.data());
    const sessions = sessionsSnap.docs.map((d) => d.data());
    const bookings = bookingsSnap.docs.map((d) => d.data());

    // Resolve the real users behind the bookings so the master view can show
    // who is assigned to each player slot / session. Keyed by userId.
    const bookerIds = Array.from(
      new Set(
        bookings
          .map((b) => (b as { userId?: string }).userId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const bookers: Record<
      string,
      { id: string; name: string | null; email: string | null }
    > = {};
    if (bookerIds.length > 0) {
      const bookerDocs = await Promise.all(
        bookerIds.map((id) => db.collection("users").doc(id).get()),
      );
      for (const docSnap of bookerDocs) {
        if (docSnap.exists) {
          const u = docSnap.data() ?? {};
          bookers[docSnap.id] = {
            id: docSnap.id,
            name: u.name ?? null,
            email: u.email ?? null,
          };
        }
      }
    }

    // Fetch the D-Master user record
    let master = null;
    const masterId = (campaign as { masterId?: string }).masterId;
    if (masterId) {
      const masterDoc = await db.collection("users").doc(masterId).get();
      if (masterDoc.exists) {
        const m = masterDoc.data() ?? {};
        master = {
          id: masterDoc.id,
          name: m.name ?? null,
          email: m.email ?? null,
          phone: m.phone ?? null,
          profileImage: m.profileImage ?? null,
        };
      }
    }

    return NextResponse.json(
      { ...campaign, players, sessions, bookings, bookers, master },
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
    const decoded = await verifyIdToken(req.headers.get("Authorization") ?? "");
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

    // Snapshot the current (pre-edit) values so the admin review page can
    // highlight exactly what the master changed. Players/sessions match by id.
    const [prevPlayersSnap, prevSessionsSnap] = await Promise.all([
      db.collection("campaigns").doc(campaignId).collection("players").get(),
      db.collection("campaigns").doc(campaignId).collection("sessions").get(),
    ]);
    const editSnapshot = {
      title: campaign?.title ?? "",
      price: campaign?.price ?? 0,
      city: campaign?.city ?? { ar: "", en: "" },
      startDate: campaign?.startDate ?? "",
      sessions: prevSessionsSnap.docs.map((d) => ({
        id: d.id,
        dateTime: d.data().dateTime ?? "",
      })),
      players: prevPlayersSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? "",
      })),
      capturedAt: now,
    };

    // Update campaign fields. A master edit always sends the campaign back
    // for admin re-approval, so reset status to Pending and clear approval.
    // `lastEditedAt` and `previouslyPublished` let admins distinguish an edit
    // from a brand-new submission during review.
    const updateData: Record<string, unknown> = {
      updatedAt: now,
      lastEditedAt: now,
      editSnapshot,
      status: CampaignStatus.PENDING,
      approvedBy: null,
      approvedAt: null,
    };
    if (campaign?.status === CampaignStatus.PUBLISHED) {
      updateData.previouslyPublished = true;
    }
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

    if (body.updatePlayers && Array.isArray(body.updatePlayers)) {
      const batch = db.batch();
      for (const player of body.updatePlayers) {
        const playerRef = db
          .collection("campaigns")
          .doc(campaignId)
          .collection("players")
          .doc(player.id);
        batch.update(playerRef, { name: player.name });
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

    // A master edit re-enters the approval queue — notify the team.
    await sendCampaignApprovalRequestEmail({
      id: campaignId,
      title: (updateData.title ?? campaign?.title) as string,
      masterId: campaign?.masterId,
      sessionsCount: (updateData.sessionsCount ??
        campaign?.sessionsCount) as number,
      playersCount: (updateData.playersCount ??
        campaign?.playersCount) as number,
      price: (updateData.price ?? campaign?.price) as number,
      city: (updateData.city ?? campaign?.city) as { ar: string; en: string },
      startDate: (updateData.startDate ?? campaign?.startDate) as string,
      lastEditedAt: now,
    });

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
    const decoded = await verifyIdToken(req.headers.get("Authorization") ?? "");
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
    const campaignData = campaignDoc.data() ?? {};
    const emailPayload = {
      id: campaignId,
      title: campaignData.title,
      masterId: campaignData.masterId,
      sessionsCount: campaignData.sessionsCount,
      playersCount: campaignData.playersCount,
      price: campaignData.price,
      city: campaignData.city,
      startDate: campaignData.startDate,
    };

    if (action === "approve") {
      await campaignRef.update({
        status: CampaignStatus.PUBLISHED,
        approvedBy: decoded.uid,
        approvedAt: now,
        updatedAt: now,
        // The edit has been reviewed — drop the diff snapshot.
        editSnapshot: null,
      });
      // Let the master know their campaign is live.
      await sendCampaignApprovedEmail(emailPayload);
      return NextResponse.json({ success: true, status: "Published" });
    }

    if (action === "reject") {
      await campaignRef.update({
        status: CampaignStatus.REJECTED,
        updatedAt: now,
        editSnapshot: null,
      });
      await sendCampaignRejectedEmail(emailPayload);
      return NextResponse.json({ success: true, status: "Rejected" });
    }

    // Master-only: withdraw (remove) or restore a player slot mid-campaign.
    // Deliberately does NOT touch the campaign status (no re-approval) and
    // sends no email — unlike a full master edit via PUT.
    if (action === "withdrawPlayer" || action === "restorePlayer") {
      if (campaignData.masterId !== decoded.uid) {
        return NextResponse.json(
          { error: "Only the campaign master can remove players" },
          { status: 403 },
        );
      }

      const { playerId } = body;
      if (!playerId) {
        return NextResponse.json(
          { error: "playerId is required" },
          { status: 400 },
        );
      }

      const playerRef = campaignRef.collection("players").doc(playerId);
      const playerDoc = await playerRef.get();
      if (!playerDoc.exists) {
        return NextResponse.json(
          { error: "Player not found" },
          { status: 404 },
        );
      }

      const withdrawing = action === "withdrawPlayer";
      await playerRef.update({
        withdrawn: withdrawing,
        withdrawnAt: withdrawing ? now : null,
      });

      return NextResponse.json({ success: true, withdrawn: withdrawing });
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
