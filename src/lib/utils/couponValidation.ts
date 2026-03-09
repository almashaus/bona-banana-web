import { Coupon, CouponStatus } from "@/src/models/coupon";
import { roundMoney } from "./utils";

/**
 * Validates whether a coupon can be applied to a given cart/order context.
 * Use at checkout to validate Discount, Voucher, and Offer coupons.
 */
export interface CouponValidationContext {
  /** Total cart value before discount */
  cartTotal: number;
  /** Number of tickets in cart */
  ticketQuantity: number;
  /** Event IDs in the cart */
  eventIds: string[];
  /** User ID (for per-user limit tracking - requires usage history) */
  userId?: string;
  /** Current user's usage count for this coupon (if known) */
  userUsageCount?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  /** Computed discount amount when valid */
  discountAmount?: number;
}

export function computeStatus(c: Coupon): CouponStatus {
  if (c.status === "Disabled") return "Disabled";
  if (c.usageLimit !== null && c.usageCount >= c.usageLimit)
    return "Fully Redeemed";
  const now = new Date();
  if (new Date(c.startDate) > now) return "Scheduled";
  if (new Date(c.endDate) < now) return "Expired";
  return "Active";
}

/**
 * Validates a Discount coupon (code-based, percentage or fixed).
 */
function validateDiscountCoupon(
  coupon: Coupon,
  ctx: CouponValidationContext,
): CouponValidationResult {
  const status = computeStatus(coupon);
  if (status !== "Active") {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  if (
    coupon.perUserLimit != null &&
    ctx.userUsageCount != null &&
    ctx.userUsageCount >= coupon.perUserLimit
  ) {
    return { valid: false, error: "couponPerUserLimitReached" };
  }

  const applicable =
    coupon.applicableEvents.length === 0 ||
    ctx.eventIds.some((eid) => coupon.applicableEvents.includes(eid));
  if (!applicable) {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  if (ctx.cartTotal < (coupon.minTicketValue ?? 0)) {
    return {
      valid: false,
      error: "couponMinNotMet",
    };
  }

  let discountAmount: number;
  if (coupon.discountKind === "percentage") {
    discountAmount = (ctx.cartTotal * coupon.discountValue) / 100;
    if (coupon.maxCap != null) {
      discountAmount = Math.min(discountAmount, coupon.maxCap);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, ctx.cartTotal);
  }

  return { valid: true, discountAmount: roundMoney(discountAmount) };
}

/**
 * Validates a Voucher (monetary credit, fixed amount).
 * Supports partial consumption when allowPartialConsumption is true.
 */
function validateVoucher(
  coupon: Coupon,
  ctx: CouponValidationContext,
  /** Remaining balance for this voucher instance (when partial consumption) */
  remainingBalance?: number,
): CouponValidationResult {
  const status = computeStatus(coupon);
  if (status !== "Active") {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  if (
    coupon.perUserLimit != null &&
    ctx.userUsageCount != null &&
    ctx.userUsageCount >= coupon.perUserLimit
  ) {
    return { valid: false, error: "couponPerUserLimitReached" };
  }

  const applicable =
    coupon.applicableEvents.length === 0 ||
    ctx.eventIds.some((eid) => coupon.applicableEvents.includes(eid));
  if (!applicable) {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  const effectiveValue =
    coupon.allowPartialConsumption && remainingBalance != null
      ? Math.min(remainingBalance, coupon.discountValue)
      : coupon.discountValue;

  const discountAmount = Math.min(effectiveValue, ctx.cartTotal);
  if (discountAmount <= 0) {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  return { valid: true, discountAmount: roundMoney(discountAmount) };
}

/**
 * Validates a Offer (auto-applied or code-based).
 * Supports percentage, fixed, and Buy X Get Y subtypes.
 */
function validateOffer(
  coupon: Coupon,
  ctx: CouponValidationContext,
): CouponValidationResult {
  const status = computeStatus(coupon);
  if (status !== "Active") {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  const applicable =
    coupon.applicableEvents.length === 0 ||
    ctx.eventIds.some((eid) => coupon.applicableEvents.includes(eid));
  if (!applicable) {
    return { valid: false, error: "couponInvalidOrExpired" };
  }

  if (
    coupon.perUserLimit != null &&
    ctx.userUsageCount != null &&
    ctx.userUsageCount >= coupon.perUserLimit
  ) {
    return { valid: false, error: "couponPerUserLimitReached" };
  }

  let discountAmount: number;

  if (
    coupon.offerSubtype === "buyXgetY" &&
    coupon.buyQuantity != null &&
    coupon.getQuantity != null
  ) {
    // Buy X Get Y: e.g. Buy 2 Get 1 Free
    const sets = Math.floor(
      ctx.ticketQuantity / (coupon.buyQuantity + coupon.getQuantity),
    );
    const freeTickets = sets * coupon.getQuantity;
    // Requires ticket-level pricing to compute; approximate as proportional
    const avgTicketPrice =
      ctx.ticketQuantity > 0 ? ctx.cartTotal / ctx.ticketQuantity : 0;
    discountAmount = freeTickets * avgTicketPrice;
  } else if (coupon.discountKind === "percentage") {
    discountAmount = (ctx.cartTotal * coupon.discountValue) / 100;
    if (coupon.maxCap != null) {
      discountAmount = Math.min(discountAmount, coupon.maxCap);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, ctx.cartTotal);
  }

  return { valid: true, discountAmount: roundMoney(discountAmount) };
}

/**
 * Main validation entry point. Validates any coupon type against checkout context.
 */
export function validateCoupon(
  coupon: Coupon,
  ctx: CouponValidationContext,
  options?: { voucherRemainingBalance?: number },
): CouponValidationResult {
  switch (coupon.type) {
    case "Discount":
      return validateDiscountCoupon(coupon, ctx);
    case "Voucher":
      return validateVoucher(coupon, ctx, options?.voucherRemainingBalance);
    case "Offer":
      return validateOffer(coupon, ctx);
    default:
      return { valid: false, error: "couponInvalidOrExpired" };
  }
}
