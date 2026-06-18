import { OrderStatus } from "../order";
import { City } from "../event";

export enum CampaignStatus {
  PENDING = "Pending",
  PUBLISHED = "Published",
  REJECTED = "Rejected",
}

export interface Campaign {
  id: string;
  title: string;

  masterId: string;

  status: CampaignStatus;

  sessionsCount: number; // 3–7
  playersCount: number; // 3–7

  price: number;

  city: City;
  startDate: Date;

  createdAt: Date;
  updatedAt: Date;

  approvedBy?: string;
  approvedAt?: Date;

  /** Set each time the D-Master edits the campaign after creation. Absent on brand-new campaigns. */
  lastEditedAt?: Date;
  /** True once the campaign has ever been published. Sticky — lets admins know an edit is of a previously-live campaign. */
  previouslyPublished?: boolean;

  /**
   * Snapshot of the editable values as they were BEFORE the most recent master edit.
   * Used by the admin review page to highlight what changed. Cleared when the admin
   * approves/rejects. Absent on brand-new campaigns and pre-feature edits.
   */
  editSnapshot?: CampaignEditSnapshot | null;
}

export interface CampaignEditSnapshot {
  title: string;
  price: number;
  city: City;
  startDate: Date;
  sessions: { id: string; dateTime: Date }[];
  players: { id: string; name: string }[];
  capturedAt: Date;
}

export interface CampaignPlayer {
  id: string;
  campaignId: string;

  name: string;

  /**
   * Whether this player slot is enabled/visible in the campaign.
   * Set to `true` when the slot is created; the DM can disable it to hide the slot.
   * This does NOT reflect booking or payment status — use the bookings collection for that.
   * A slot that is fully booked (all sessions paid) will still have `isActive: true`;
   * use `isPlayerFullyBooked()` in the UI to determine booking state.
   */
  isActive: boolean;

  /** Populated once the user pays for ALL sessions in the campaign. */
  assignedUserId?: string;

  /**
   * Set `true` when the master withdraws (removes) this player mid-campaign.
   * Withdrawn slots stay visible to the master — labeled "withdrawn" — but are
   * hidden from the player/visitor view. Withdrawing does NOT require admin
   * re-approval and sends no email (unlike a full campaign edit).
   */
  withdrawn?: boolean;
  /** When the slot was withdrawn. Cleared (null) if the master restores it. */
  withdrawnAt?: Date | null;

  createdAt: Date;
}

export interface CampaignSession {
  id: string;
  campaignId: string;

  sessionNumber: number;
  dateTime: Date;

  createdAt: Date;
}

export enum BookingStatus {
  PENDING = "Pending",
  PAID = "Paid",
  CANCELED = "Canceled",
}

export interface CampaignBooking {
  id: string; // (session id + player id suffix)
  campaignId: string;
  sessionId: string;
  playerId: string;

  userId: string;

  status: BookingStatus;

  orderId?: string; // link to campaignOrders

  createdAt: Date;
}

export interface CampaignOrder {
  id: string;

  campaignId: string;
  sessionIds: string[];

  userId: string;

  invoiceId: string;
  paymentMethod: string;

  totalAmount: number;
  discountAmount: number;

  status: OrderStatus;

  orderDate: Date;
}
