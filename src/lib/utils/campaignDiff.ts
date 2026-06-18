import { Campaign, CampaignEditSnapshot } from "@/src/models/campaign/campaign";

export interface CampaignChanges {
  /** Set of changed keys: "title" | "price" | "city" | "startDate" | `session:<id>` | `player:<id>`. */
  changed: Set<string>;
  /** Previous (pre-edit) value keyed the same way as `changed`. */
  oldValues: Record<string, unknown>;
}

/** Normalize a date-ish value (ISO string or Date) for comparison. */
function norm(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? String(v) : d.toISOString();
}

/**
 * Diff a campaign (with its sessions/players already attached) against the
 * snapshot captured before the master's last edit. Returns `null` when there
 * is no snapshot (brand-new campaigns or pre-feature edits).
 *
 * Sessions and players are matched by id — counts are fixed during edit, so
 * the id sets are stable.
 */
export function getCampaignChanges(
  campaign: Campaign & {
    sessions?: { id: string; dateTime: Date }[];
    players?: { id: string; name: string }[];
  },
  snapshot: CampaignEditSnapshot | null | undefined,
): CampaignChanges | null {
  if (!snapshot) return null;

  const changed = new Set<string>();
  const oldValues: Record<string, unknown> = {};

  const mark = (key: string, oldValue: unknown) => {
    changed.add(key);
    oldValues[key] = oldValue;
  };

  if (campaign.title !== snapshot.title) mark("title", snapshot.title);
  if (campaign.price !== snapshot.price) mark("price", snapshot.price);
  if (
    campaign.city?.en !== snapshot.city?.en ||
    campaign.city?.ar !== snapshot.city?.ar
  )
    mark("city", snapshot.city);
  if (norm(campaign.startDate) !== norm(snapshot.startDate))
    mark("startDate", snapshot.startDate);

  const prevSessions = new Map(
    (snapshot.sessions ?? []).map((s) => [s.id, s.dateTime]),
  );
  for (const s of campaign.sessions ?? []) {
    const prev = prevSessions.get(s.id);
    if (prev !== undefined && norm(prev) !== norm(s.dateTime))
      mark(`session:${s.id}`, prev);
  }

  const prevPlayers = new Map(
    (snapshot.players ?? []).map((p) => [p.id, p.name]),
  );
  for (const p of campaign.players ?? []) {
    const prev = prevPlayers.get(p.id);
    if (prev !== undefined && prev !== p.name) mark(`player:${p.id}`, prev);
  }

  return { changed, oldValues };
}
