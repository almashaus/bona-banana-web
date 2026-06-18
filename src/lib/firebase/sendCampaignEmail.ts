import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import {
  CampaignApprovalRequestEmail,
  CampaignApprovedEmail,
  CampaignBookingPaidEmail,
  CampaignEmailData,
  CampaignRejectedEmail,
} from "@/src/lib/utils/campaignEmails";
import { Resend } from "resend";

const FROM = "Bona Banana <info@bona-banana.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/** Look up a user's display name and email via the Admin SDK. */
async function getUserContact(
  userId?: string,
): Promise<{ email: string | null; name: string | null }> {
  if (!userId) return { email: null, name: null };
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return { email: null, name: null };
    const d = doc.data() ?? {};
    return { email: d.email ?? null, name: d.name ?? null };
  } catch (error) {
    console.error("getUserContact error:", error);
    return { email: null, name: null };
  }
}

/**
 * 1) Notify the Bona Banana team that a campaign needs approval.
 *    Sent on campaign creation and on every master edit (re-approval).
 */
export async function sendCampaignApprovalRequestEmail(
  campaign: CampaignEmailData,
) {
  const adminEmail = process.env.NEXT_PUBLIC_BONA_A_EMAIL;
  if (!adminEmail) {
    console.warn(
      "NEXT_PUBLIC_BONA_A_EMAIL not set — skipping approval-request email",
    );
    return false;
  }

  const { name: masterName } = await getUserContact(campaign.masterId);

  try {
    const { data } = await getResend().emails.send({
      from: FROM,
      to: adminEmail,
      subject: campaign.lastEditedAt
        ? `Campaign edit needs review: ${campaign.title ?? campaign.id}`
        : `New campaign needs approval: ${campaign.title ?? campaign.id}`,
      react: CampaignApprovalRequestEmail({ campaign, masterName }),
    });
    return Boolean(data);
  } catch (error) {
    console.error("sendCampaignApprovalRequestEmail error:", error);
    return false;
  }
}

/** 2) Notify the master that their campaign was approved and published. */
export async function sendCampaignApprovedEmail(campaign: CampaignEmailData) {
  const { email, name } = await getUserContact(campaign.masterId);
  if (!email) return false;

  try {
    const { data } = await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your campaign is live: ${campaign.title ?? campaign.id}`,
      react: CampaignApprovedEmail({ campaign, masterName: name }),
    });
    return Boolean(data);
  } catch (error) {
    console.error("sendCampaignApprovedEmail error:", error);
    return false;
  }
}

/** 3) Notify the master that their campaign was rejected. */
export async function sendCampaignRejectedEmail(campaign: CampaignEmailData) {
  const { email, name } = await getUserContact(campaign.masterId);
  if (!email) return false;

  try {
    const { data } = await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Update on your campaign: ${campaign.title ?? campaign.id}`,
      react: CampaignRejectedEmail({ campaign, masterName: name }),
    });
    return Boolean(data);
  } catch (error) {
    console.error("sendCampaignRejectedEmail error:", error);
    return false;
  }
}

/** 4) Notify the master that a player paid for a booking in their campaign. */
export async function sendCampaignBookingPaidEmail({
  campaign,
  playerName,
  bookerId,
  sessionCount,
}: {
  campaign: CampaignEmailData;
  playerName?: string | null;
  bookerId?: string;
  sessionCount: number;
}) {
  const [{ email, name }, booker] = await Promise.all([
    getUserContact(campaign.masterId),
    getUserContact(bookerId),
  ]);
  if (!email) return false;

  try {
    const { data } = await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `New booking in ${campaign.title ?? "your campaign"}`,
      react: CampaignBookingPaidEmail({
        campaign,
        masterName: name,
        playerName,
        bookerName: booker.name,
        sessionCount,
      }),
    });
    return Boolean(data);
  } catch (error) {
    console.error("sendCampaignBookingPaidEmail error:", error);
    return false;
  }
}
