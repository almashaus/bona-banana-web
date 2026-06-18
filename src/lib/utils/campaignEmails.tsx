import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type * as React from "react";
import { City } from "@/src/models/event";

/**
 * Minimal campaign shape needed to render the emails. Dates are accepted as
 * `Date | string` because Firestore stores them as ISO strings (see CLAUDE.md).
 */
export interface CampaignEmailData {
  id?: string;
  title?: string;
  masterId?: string;
  sessionsCount?: number;
  playersCount?: number;
  price?: number;
  city?: City;
  startDate?: Date | string;
  /** Present when the email is for a re-submitted edit rather than a new campaign. */
  lastEditedAt?: Date | string;
}

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://tickets.bona-banana.com";

const LOGO_SRC =
  "https://firebasestorage.googleapis.com/v0/b/bona-banana.firebasestorage.app/o/app%2Fbona-banana.png?alt=media&token=e7ea830c-98da-4a01-b7e8-d68a684d9916";

function formatDate(value?: Date | string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Shared shell so every campaign email has the same header / footer chrome. */
function EmailShell({
  badgeColor,
  heading,
  intro,
  children,
}: {
  badgeColor: string;
  heading: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: "center", paddingTop: 32 }}>
            <Img
              src={LOGO_SRC}
              width={96}
              height={67}
              alt="Bona Banana"
              style={{ display: "block", margin: "0 auto" }}
            />
            <div
              style={{
                ...badge,
                background: badgeColor,
              }}
            />
            <Heading style={headingStyle}>{heading}</Heading>
            <Text style={mutedText}>{intro}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ padding: "24px" }}>{children}</Section>

          <Hr style={hr} />

          <Section style={{ textAlign: "center", padding: "24px" }}>
            <a
              href="https://tickets.bona-banana.com"
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <Text
                style={{
                  color: "#f49b32",
                  marginTop: 8,
                  fontSize: 13,
                  textDecoration: "underline",
                  textDecorationColor: "#f49b32",
                }}
              >
                www.tickets.bona-banana.com
              </Text>
            </a>
            <Text style={{ ...mutedText, marginTop: 8, fontSize: 12 }}>
              &copy; {new Date().getFullYear()} Bona Banana. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ marginBottom: 8 }}>
      <Column>
        <Text style={detailLabel}>{label}</Text>
      </Column>
      <Column align="right">
        <Text style={detailValue}>{value}</Text>
      </Column>
    </Row>
  );
}

function CampaignDetails({ campaign }: { campaign: CampaignEmailData }) {
  return (
    <Section style={detailsCard}>
      <DetailRow label="Campaign" value={campaign.title ?? "—"} />
      <DetailRow label="City" value={campaign.city?.en ?? "—"} />
      <DetailRow label="Start date" value={formatDate(campaign.startDate)} />
      <DetailRow
        label="Sessions"
        value={String(campaign.sessionsCount ?? "—")}
      />
      <DetailRow label="Players" value={String(campaign.playersCount ?? "—")} />
      <DetailRow label="Price / session" value={`${campaign.price ?? 0} SR`} />
    </Section>
  );
}

/* ---------------------------------------------------------------- */
/* 1) Admin: a new campaign needs approval                          */
/* ---------------------------------------------------------------- */
export function CampaignApprovalRequestEmail({
  campaign,
  masterName,
}: {
  campaign: CampaignEmailData;
  masterName?: string | null;
}) {
  const isEdit = Boolean(campaign.lastEditedAt);
  return (
    <EmailShell
      badgeColor="#f49b32"
      heading={
        isEdit
          ? "A campaign edit needs review"
          : "A new campaign needs approval"
      }
      intro={
        isEdit
          ? `${masterName ?? "A D-Master"} edited a campaign and resubmitted it for approval.`
          : `${masterName ?? "A D-Master"} created a new campaign and is awaiting your approval.`
      }
    >
      <CampaignDetails campaign={campaign} />
      <Section style={{ textAlign: "center", marginTop: 8 }}>
        <Button
          href={`${baseUrl}/admin/dnd/${campaign.id}`}
          style={{ ...button, background: "#213421" }}
        >
          Review campaign
        </Button>
      </Section>
    </EmailShell>
  );
}

/* ---------------------------------------------------------------- */
/* 2) Master: campaign approved / published                         */
/* ---------------------------------------------------------------- */
export function CampaignApprovedEmail({
  campaign,
  masterName,
}: {
  campaign: CampaignEmailData;
  masterName?: string | null;
}) {
  return (
    <EmailShell
      badgeColor="#16a34a"
      heading="Your campaign is live! 🎉"
      intro={`${masterName ? masterName + ", your" : "Your"} campaign has been approved and is now published. Players can browse it and book their seats.`}
    >
      <CampaignDetails campaign={campaign} />
      <Section style={{ textAlign: "center", marginTop: 8 }}>
        <Button
          href={`${baseUrl}/dnd/${campaign.id}`}
          style={{ ...button, background: "#213421" }}
        >
          View campaign
        </Button>
      </Section>
    </EmailShell>
  );
}

/* ---------------------------------------------------------------- */
/* 3) Master: campaign rejected                                     */
/* ---------------------------------------------------------------- */
export function CampaignRejectedEmail({
  campaign,
  masterName,
}: {
  campaign: CampaignEmailData;
  masterName?: string | null;
}) {
  return (
    <EmailShell
      badgeColor="#e64936"
      heading="Your campaign was not approved"
      intro={`${masterName ? masterName + ", your" : "Your"} campaign was reviewed but could not be published at this time. You can edit it and resubmit it for approval.`}
    >
      <CampaignDetails campaign={campaign} />
      <Section style={{ textAlign: "center", marginTop: 8 }}>
        <Button
          href={`${baseUrl}/dnd/${campaign.id}/edit`}
          style={{ ...button, background: "#213421" }}
        >
          Edit & resubmit
        </Button>
      </Section>
    </EmailShell>
  );
}

/* ---------------------------------------------------------------- */
/* 4) Master: a player paid for a booking                           */
/* ---------------------------------------------------------------- */
export function CampaignBookingPaidEmail({
  campaign,
  masterName,
  playerName,
  bookerName,
  sessionCount,
}: {
  campaign: CampaignEmailData;
  masterName?: string | null;
  playerName?: string | null;
  bookerName?: string | null;
  sessionCount: number;
}) {
  return (
    <EmailShell
      badgeColor="#16a34a"
      heading="New booking in your campaign"
      intro={`${masterName ? masterName + ", a" : "A"} new booking was confirmed for your campaign.`}
    >
      <Section style={detailsCard}>
        <DetailRow label="Campaign" value={campaign.title ?? "—"} />
        {playerName ? (
          <DetailRow label="Player slot" value={playerName} />
        ) : null}
        {bookerName ? <DetailRow label="Booked by" value={bookerName} /> : null}
        <DetailRow label="Sessions booked" value={String(sessionCount)} />
      </Section>
      <Section style={{ textAlign: "center", marginTop: 8 }}>
        <Button
          href={`${baseUrl}/dnd/${campaign.id}`}
          style={{ ...button, background: "#213421" }}
        >
          View campaign
        </Button>
      </Section>
    </EmailShell>
  );
}

/* ----------------------------- styles ----------------------------- */
const main = {
  backgroundColor: "#f3e8cc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "24px 0",
};

const container = {
  margin: "0 auto",
  width: "600px",
  maxWidth: "100%",
  border: "1px solid #E5E5E5",
  borderRadius: "12px",
  background: "#fff",
};

const badge = {
  width: 48,
  height: 4,
  borderRadius: 9999,
  margin: "16px auto 0",
};

const headingStyle = {
  fontSize: "26px",
  fontWeight: 700,
  margin: "16px 0 8px 0",
  textAlign: "center" as const,
  color: "#213421",
};

const mutedText = {
  color: "#666",
  fontSize: "15px",
  lineHeight: "1.6",
  textAlign: "center" as const,
  padding: "0 24px",
};

const detailsCard = {
  background: "#faf6ec",
  border: "1px solid #efe3c6",
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 16,
};

const detailLabel = {
  fontSize: 14,
  color: "#888",
  margin: 0,
};

const detailValue = {
  fontSize: 15,
  fontWeight: 600,
  color: "#222",
  margin: 0,
};

const button = {
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  padding: "12px 28px",
  borderRadius: 8,
  textDecoration: "none",
  display: "inline-block",
};

const hr = {
  borderColor: "#E5E5E5",
  margin: "0",
};
