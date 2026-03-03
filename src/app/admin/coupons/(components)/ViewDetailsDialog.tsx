"use client";

import { Tag, Gift, Megaphone, Globe } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Card, CardContent } from "@/src/components/ui/card";
import { Coupon, CouponType } from "@/src/models/coupon";
import { Event } from "@/src/models/event";
import { price } from "@/src/lib/utils/locales";
import { formatDateShort } from "@/src/lib/utils/formatDate";
import { statusColor, typeBadgeColor } from "@/src/lib/utils/styles";
import { computeStatus } from "@/src/lib/utils/couponValidation";

function typeIcon(t: CouponType) {
  switch (t) {
    case "Discount":
      return <Tag className="h-4 w-4" />;
    case "Voucher":
      return <Gift className="h-4 w-4" />;
    case "Offer":
      return <Megaphone className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
}

interface ViewDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  events: Event[];
}

export function ViewDetailsDialog({
  open,
  onOpenChange,
  coupon,
  events,
}: ViewDetailsDialogProps) {
  const eventName = (id: string) =>
    events.find((e) => e.id === id)?.title ?? id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="ltr"
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-stone-100"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {coupon && typeIcon(coupon.type)}
            Coupon Details
          </DialogTitle>
          <DialogDescription>
            Full information for{" "}
            {coupon?.code ? (
              <>
                coupon{" "}
                <span className="font-mono font-semibold text-greenColor">
                  {coupon.code}
                </span>
              </>
            ) : (
              <>auto-applied Offer</>
            )}
          </DialogDescription>
        </DialogHeader>

        {coupon && (
          <div className="grid gap-6 ">
            {/* Summary row */}
            <div className="flex flex-wrap gap-2">
              <Badge className={typeBadgeColor(coupon.type)}>
                {coupon.type}
              </Badge>
              <Badge className={statusColor(computeStatus(coupon))}>
                {computeStatus(coupon)}
              </Badge>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-border rounded-lg p-4">
              <div>
                <Label className="text-muted-foreground text-xs">
                  Coupon Code
                </Label>
                <p className="font-mono font-bold text-lg">
                  {coupon.code || (
                    <Badge variant="outline" className="font-normal">
                      Auto-applied (no code)
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Discount / Value
                </Label>
                <p className="font-semibold">
                  {coupon.type === "Offer" &&
                  coupon.offerSubtype === "buyXgetY" &&
                  coupon.buyQuantity != null &&
                  coupon.getQuantity != null ? (
                    <>
                      Buy {coupon.buyQuantity} Get {coupon.getQuantity} Free
                    </>
                  ) : coupon.discountKind === "percentage" ? (
                    <>
                      <span>{coupon.discountValue}%</span>
                      {coupon.maxCap !== null && (
                        <span className="text-sm text-muted-foreground ms-2">
                          (max {price(coupon.maxCap)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>{price(coupon.discountValue)}</span>
                    </>
                  )}
                </p>
              </div>
              {coupon.type === "Voucher" && coupon.allowPartialConsumption && (
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Partial Consumption
                  </Label>
                  <p className="text-sm">Allowed (remaining balance tracked)</p>
                </div>
              )}
              {coupon.type === "Offer" && (
                <>
                  {coupon.autoApply && (
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Auto-Apply
                      </Label>
                      <p className="text-sm">
                        Yes — applied automatically at checkout
                      </p>
                    </div>
                  )}
                  {coupon.offerSubtype && (
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Offer Subtype
                      </Label>
                      <p className="text-sm capitalize">
                        {coupon.offerSubtype === "buyXgetY"
                          ? "Buy X Get Y"
                          : coupon.offerSubtype
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div>
                <Label className="text-muted-foreground text-xs">
                  Validity Period
                </Label>
                <p className="text-sm">
                  {formatDateShort(new Date(coupon.startDate))} &mdash;{" "}
                  {formatDateShort(new Date(coupon.endDate))}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Minimum Ticket Amount
                </Label>
                <p className="text-sm">
                  {coupon.minTicketValue !== null
                    ? price(coupon.minTicketValue)
                    : "None"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Usage</Label>
                <p className="text-sm">
                  {coupon.usageCount}
                  {coupon.usageLimit !== null
                    ? ` / ${coupon.usageLimit}`
                    : " (Unlimited)"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Per-User Limit
                </Label>
                <p className="text-sm">
                  {coupon.perUserLimit !== null
                    ? coupon.perUserLimit
                    : "Unlimited"}
                </p>
              </div>
            </div>

            {/* Events */}
            <div className="bg-white border border-border rounded-lg p-4">
              <Label className="text-muted-foreground text-xs">
                Applicable Events
              </Label>
              {coupon.applicableEvents.length === 0 ? (
                <p className="text-sm flex items-center gap-1 mt-1">
                  <Globe className="h-4 w-4 text-muted-foreground" /> All Events
                  (Global)
                </p>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {coupon.applicableEvents.map((eid) => (
                    <Badge key={eid} variant="outline">
                      {eventName(eid)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Revenue Impact
                  </p>
                  <p className="text-xl font-bold">
                    {price(coupon.revenueImpact)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Discount Granted
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    -{price(coupon.discountImpact)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Remaining
                  </p>
                  <p className="text-xl font-bold">
                    {coupon.usageLimit !== null
                      ? Math.max(0, coupon.usageLimit - coupon.usageCount)
                      : "Unlimited"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {coupon.description && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Description
                </Label>
                <p className="text-sm mt-1">{coupon.description}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
