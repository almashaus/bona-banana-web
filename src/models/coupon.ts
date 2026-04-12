export type CouponType = "Discount" | "Voucher" | "Offer";
export type DiscountKind = "percentage" | "fixed";
export type CouponStatus =
  | "Active"
  | "Scheduled"
  | "Expired"
  | "Disabled"
  | "Fully Redeemed";

/** Offer subtype for Offer coupons (e.g. Buy X Get Y) */
export type OfferSubtype = "discount" | "buyXgetY";

export interface Coupon {
  id: string;
  /** Empty for auto-applied Offer (no code required) */
  code: string;
  type: CouponType;
  discountKind: DiscountKind;
  discountValue: number;
  maxCap: number | null;
  minTicketValue: number | null;
  applicableEvents: string[]; // event ids, empty = all
  usageLimit: number | null;
  perUserLimit: number | null;
  usageCount: number;
  revenueImpact: number;
  discountImpact: number;
  startDate: string;
  endDate: string;
  status: CouponStatus;
  description: string;
  createdAt: string;
  /** Firestore: last update timestamp (for ordering) */
  updatedAt?: string;

  // ── Voucher-specific ───────────────────────────────────────────────
  /** If true, voucher can be partially consumed; remaining balance tracked per redemption */
  allowPartialConsumption?: boolean;
  /** "fixedAmount" (monetary credit) | "freeTicket" (full ticket price covered) */
  voucherKind?: "fixedAmount" | "freeTicket";
  /** If set, only this user can redeem this voucher */
  assignedUserId?: string | null;

  // ── Offer-specific ───────────────────────────────────────────
  /** If true, applied automatically at checkout; no code required */
  autoApply?: boolean;
  /** Subtype for Offer (e.g. Buy X Get Y) */
  offerSubtype?: OfferSubtype;
  /** For Buy X Get Y: number of items to buy (e.g. 2) */
  buyQuantity?: number | null;
  /** For Buy X Get Y: number of items free (e.g. 1) */
  getQuantity?: number | null;
}

export interface VoucherBalance {
  id: string;
  couponId: string;
  userId: string;
  remainingBalance: number;
  updatedAt: string;
}

export interface CouponUsage {
  id?: string;
  couponId: string;
  orderId: string;
  userId: string;
  discountAmount: number;
  timestamp: string;
}
