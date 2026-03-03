"use client";

import { Info, CalendarIcon, Tag, Gift, Megaphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
import { cn } from "@/src/lib/utils/utils";
import {
  Coupon,
  CouponType,
  DiscountKind,
  OfferSubtype,
} from "@/src/models/coupon";
import { Event } from "@/src/models/event";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Separator } from "@/src/components/ui/separator";
import { price } from "@/src/lib/utils/locales";
import { typeBadgeColor } from "@/src/lib/utils/styles";

export interface CouponFormState {
  code: string;
  type: CouponType;
  discountKind: DiscountKind;
  discountValue: string;
  maxCap: string;
  minTicketValue: string;
  applicableEvents: string[];
  allEvents: boolean;
  usageLimit: string;
  perUserLimit: string;
  startDate: string;
  endDate: string;
  description: string;
  allowPartialConsumption: boolean;
  autoApply: boolean;
  offerSubtype: OfferSubtype;
  buyQuantity: string;
  getQuantity: string;
}

interface CreateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CouponFormState;
  setForm: React.Dispatch<React.SetStateAction<CouponFormState>>;
  formErrors: Record<string, string>;
  editingCoupon: Coupon | null;
  events: Event[];
  isSaving: boolean;
  onSave: () => void;
  onToggleEventSelection: (eventId: string) => void;
}

export function CreateEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  formErrors,
  editingCoupon,
  events,
  isSaving,
  onSave,
  onToggleEventSelection,
}: CreateEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="ltr"
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-stone-50"
      >
        <DialogHeader>
          <DialogTitle>
            {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
          </DialogTitle>
          <DialogDescription>
            {editingCoupon
              ? `Editing coupon "${editingCoupon.code}".${editingCoupon.usageCount > 0 ? " Note: structural changes are restricted for used coupons." : ""}`
              : "Fill in the details below to create a new coupon."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Row 1: Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="coupon-code">
                Coupon Code{" "}
                {form.type !== "Offer" || !form.autoApply ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <></>
                )}
              </Label>
              <Input
                id="coupon-code"
                placeholder={
                  form.type === "Offer" && form.autoApply
                    ? "No code — auto-applied"
                    : "SUMMER25"
                }
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="font-mono"
                disabled={form.type === "Offer" && form.autoApply}
              />
              {formErrors.code && (
                <p className="text-xs text-red-500">{formErrors.code}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coupon-type">
                Coupon Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  const newType = v as CouponType;
                  setForm({
                    ...form,
                    type: newType,
                    discountKind:
                      newType === "Voucher" ? "fixed" : form.discountKind,
                  });
                }}
                disabled={!!editingCoupon && editingCoupon.usageCount > 0}
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Discount">
                    <div className="flex flex-row items-center gap-2 text-sky-700">
                      <Tag className="h-4 w-4 text-sky-700" />
                      Discount
                    </div>
                  </SelectItem>
                  <SelectItem value="Voucher">
                    <div className="flex flex-row items-center gap-2 text-violet-700">
                      <Gift className="h-4 w-4 text-violet-700" />
                      Voucher
                    </div>
                  </SelectItem>
                  <SelectItem value="Offer">
                    <div className="flex flex-row items-center gap-2 text-orange-700">
                      <Megaphone className="h-4 w-4 text-orange-700" />
                      Offer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Offer: Auto-apply & subtype */}
          {form.type === "Offer" && (
            <div className="grid grid-cols-1  gap-4">
              <div className="flex items-center gap-3 mb-2">
                <Switch
                  id="auto-apply"
                  checked={form.autoApply}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      autoApply: checked,
                      code: checked ? "" : form.code,
                    })
                  }
                  disabled={!!editingCoupon && editingCoupon.usageCount > 0}
                />
                <Label
                  htmlFor="auto-apply"
                  className=" cursor-pointer font-normal"
                >
                  Auto-apply (no code required)
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="offer-subtype">Offer Subtype</Label>
                  <Select
                    value={form.offerSubtype}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        offerSubtype: v as OfferSubtype,
                      })
                    }
                    disabled={!!editingCoupon && editingCoupon.usageCount > 0}
                  >
                    <SelectTrigger id="offer-subtype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>

                      <SelectItem value="buyXgetY">Buy X Get Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Buy X Get Y fields */}
          {form.type === "Offer" && form.offerSubtype === "buyXgetY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buy-quantity">
                  Buy Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buy-quantity"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={form.buyQuantity}
                  onChange={(e) =>
                    setForm({ ...form, buyQuantity: e.target.value })
                  }
                />
                {formErrors.buyQuantity && (
                  <p className="text-xs text-red-500">
                    {formErrors.buyQuantity}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="get-quantity">
                  Get Free Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="get-quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.getQuantity}
                  onChange={(e) =>
                    setForm({ ...form, getQuantity: e.target.value })
                  }
                />
                {formErrors.getQuantity && (
                  <p className="text-xs text-red-500">
                    {formErrors.getQuantity}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Row 2: Discount kind & value (hidden for Buy X Get Y) */}
          {!(form.type === "Offer" && form.offerSubtype === "buyXgetY") && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount-kind">
                  Discount Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.discountKind}
                  onValueChange={(v) =>
                    setForm({ ...form, discountKind: v as DiscountKind })
                  }
                  disabled={
                    form.type === "Voucher" ||
                    (!!editingCoupon && editingCoupon.usageCount > 0)
                  }
                >
                  <SelectTrigger id="discount-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>

                {formErrors.discountKind && (
                  <p className="text-xs text-red-500">
                    {formErrors.discountKind}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount-value">
                  Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0"
                  step={form.discountKind === "percentage" ? "1" : "0.01"}
                  placeholder={
                    form.discountKind === "percentage" ? "25" : "50.00"
                  }
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                />
                {formErrors.discountValue && (
                  <p className="text-xs text-red-500">
                    {formErrors.discountValue}
                  </p>
                )}
              </div>
              {form.discountKind === "percentage" && (
                <div className="grid gap-2">
                  <Label htmlFor="max-cap">Max Discount Cap</Label>
                  <Input
                    id="max-cap"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    value={form.maxCap}
                    onChange={(e) =>
                      setForm({ ...form, maxCap: e.target.value })
                    }
                  />
                  {formErrors.maxCap && (
                    <p className="text-xs text-red-500">{formErrors.maxCap}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voucher: Allow partial consumption */}
          {form.type === "Voucher" && (
            <div className="flex items-center gap-3">
              <Switch
                id="allow-partial"
                checked={form.allowPartialConsumption}
                onCheckedChange={(checked) =>
                  setForm({ ...form, allowPartialConsumption: checked })
                }
              />
              <Label
                htmlFor="allow-partial"
                className="cursor-pointer font-normal"
              >
                Allow partial consumption (remaining balance tracked per
                redemption)
              </Label>
            </div>
          )}

          {/* Row 3: Min ticket value */}
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min-ticket">
                Minimum Ticket Amount
                <span className="text-xs text-muted-foreground font-normal ms-2">
                  (Optional)
                </span>
              </Label>
              <Input
                id="min-ticket"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 SR"
                value={form.minTicketValue}
                onChange={(e) =>
                  setForm({ ...form, minTicketValue: e.target.value })
                }
              />
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">
                Start Date & Time <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-white",
                      !form.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.startDate ? (
                      <span>{formatDate(new Date(form.startDate))}</span>
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    dir="ltr"
                    mode="single"
                    selected={
                      form.startDate ? new Date(form.startDate) : undefined
                    }
                    onSelect={(day) => {
                      if (day) {
                        setForm({
                          ...form,
                          startDate: day.toDateString(),
                        });
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {formErrors.startDate && (
                <p className="text-xs text-red-500">{formErrors.startDate}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">
                End Date & Time <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-white",
                      !form.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.endDate ? (
                      <span>{formatDate(new Date(form.endDate))}</span>
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    dir="ltr"
                    mode="single"
                    selected={form.endDate ? new Date(form.endDate) : undefined}
                    onSelect={(day) => {
                      if (day) {
                        setForm({ ...form, endDate: day.toDateString() });
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>

              {formErrors.endDate && (
                <p className="text-xs text-red-500">{formErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Row 5: Usage limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="usage-limit">
                Usage Limit
                <span className="text-xs text-muted-foreground font-normal ms-2">
                  (Optional)
                </span>
              </Label>
              <Input
                id="usage-limit"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) =>
                  setForm({ ...form, usageLimit: e.target.value })
                }
              />
              {formErrors.usageLimit && (
                <p className="text-xs text-red-500">{formErrors.usageLimit}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="per-user-limit">
                Per-User Limit
                <span className="text-xs text-muted-foreground font-normal ms-2">
                  (Optional)
                </span>
              </Label>
              <Input
                id="per-user-limit"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.perUserLimit}
                onChange={(e) =>
                  setForm({ ...form, perUserLimit: e.target.value })
                }
              />
              {formErrors.perUserLimit && (
                <p className="text-xs text-red-500">
                  {formErrors.perUserLimit}
                </p>
              )}
            </div>
          </div>

          {/* Row 6: Event applicability */}
          <div className="grid gap-2">
            <Label>
              Event Applicability <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3 mb-2">
              <Switch
                id="all-events"
                checked={form.allEvents}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    allEvents: checked,
                    applicableEvents: checked ? [] : form.applicableEvents,
                  })
                }
              />
              <Label
                htmlFor="all-events"
                className="cursor-pointer font-normal"
              >
                Apply to all events
              </Label>
            </div>
            {!form.allEvents && (
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto grid gap-2">
                {events.map((ev) => (
                  <label
                    key={ev.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      className="rounded accent-greenColor focus:ring-greenColor "
                      checked={form.applicableEvents.includes(ev.id)}
                      onChange={() => onToggleEventSelection(ev.id)}
                    />
                    <span className="text-sm">{ev.title}</span>
                  </label>
                ))}
              </div>
            )}
            {formErrors.applicableEvents && (
              <p className="text-xs text-red-500">
                {formErrors.applicableEvents}
              </p>
            )}
          </div>

          {/* Row 7: Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional internal description..."
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Restricted edit warning */}
          {editingCoupon && editingCoupon.usageCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-amber-800 dark:text-amber-300">
                This coupon has been used {editingCoupon.usageCount} time(s).
                Coupon type and discount type fields are locked to prevent
                structural changes.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingCoupon
                ? "Update Coupon"
                : "Create Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
