"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  Tag,
  Percent,
  DollarSign,
  Globe,
  ToggleLeft,
  ToggleRight,
  Gift,
  Megaphone,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { getAuth } from "firebase/auth";
import { useToast } from "@/src/components/ui/use-toast";
import useSWR, { mutate } from "swr";
import { Event } from "@/src/models/event";
import { price } from "@/src/lib/utils/locales";
import { formatDateShort } from "@/src/lib/utils/formatDate";
import {
  Coupon,
  DiscountKind,
  CouponType,
  OfferSubtype,
} from "@/src/models/coupon";
import { statusColor, typeBadgeColor } from "@/src/lib/utils/styles";
import { computeStatus } from "@/src/lib/utils/couponValidation";
import Loading from "@/src/components/ui/loading";
import { ViewDetailsDialog } from "./(components)/ViewDetailsDialog";
import {
  CreateEditDialog,
  type CouponFormState,
} from "./(components)/CreateEditDialog";
import { DeleteConfirmationDialog } from "./(components)/DeleteConfirmationDialog";

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── Blank form state ───────────────────────────────────────────────────

const blankForm: CouponFormState = {
  code: "",
  type: "Discount" as CouponType,
  discountKind: "percentage" as DiscountKind,
  discountValue: "",
  maxCap: "",
  minTicketValue: "",
  applicableEvents: [] as string[],
  allEvents: true,
  usageLimit: "",
  perUserLimit: "",
  startDate: "",
  endDate: "",
  description: "",
  // Voucher-specific
  allowPartialConsumption: false,
  // Offer-specific
  autoApply: false,
  offerSubtype: "discount" as OfferSubtype,
  buyQuantity: "",
  getQuantity: "",
};

// ── Page ───────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [sortField, setSortField] = useState<
    "code" | "usageCount" | "revenueImpact" | "startDate"
  >("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [copiedCode, setCopiedCode] = useState("");

  // dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(blankForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, isLoading } = useSWR<ResponseData>("/api/admin/coupons");
  interface ResponseData {
    events: Event[];
    coupons: Coupon[];
  }

  useEffect(() => {
    if (data) {
      setEvents(data.events);
      setCoupons(data.coupons);
    }
  }, [data]);

  // ── Derived: recalculate live statuses ──────────────────────────────
  const liveCoupons = useMemo(
    () => coupons.map((c) => ({ ...c, status: computeStatus(c) })),
    [coupons],
  );

  // ── Filtering & sorting ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = liveCoupons;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.code && c.code.toLowerCase().includes(q)) ||
          (q === "auto" && c.type === "Offer" && c.autoApply) ||
          c.description.toLowerCase().includes(q) ||
          events
            .filter((e) => c.applicableEvents.includes(e.id))
            .some((e) => e.title.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== "all")
      list = list.filter((c) => c.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((c) => c.type === typeFilter);
    if (eventFilter !== "all")
      list = list.filter(
        (c) =>
          c.applicableEvents.length === 0 ||
          c.applicableEvents.includes(eventFilter),
      );

    list = [...list].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return 0;
    });

    return list;
  }, [
    liveCoupons,
    search,
    statusFilter,
    typeFilter,
    eventFilter,
    sortField,
    sortDir,
  ]);

  // ── Summary cards ───────────────────────────────────────────────────
  const totalActive = liveCoupons.filter((c) => c.status === "Active").length;
  const totalRevenue = liveCoupons.reduce((s, c) => s + c.revenueImpact, 0);
  const totalDiscount = liveCoupons.reduce((s, c) => s + c.discountImpact, 0);
  const totalUsage = liveCoupons.reduce((s, c) => s + c.usageCount, 0);

  // ── Clipboard ───────────────────────────────────────────────────────
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
    toast({
      title: "Copied!",
      description: `Coupon code "${code}" copied to clipboard.`,
      variant: "success",
    });
  };

  // ── Sort toggle ─────────────────────────────────────────────────────
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ── Form helpers ────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCoupon(null);
    setForm(blankForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      type: c.type,
      discountKind: c.discountKind,
      discountValue: String(c.discountValue),
      maxCap: c.maxCap !== null ? String(c.maxCap) : "",
      minTicketValue: c.minTicketValue !== null ? String(c.minTicketValue) : "",
      applicableEvents: c.applicableEvents,
      allEvents: c.applicableEvents.length === 0,
      usageLimit: c.usageLimit !== null ? String(c.usageLimit) : "",
      perUserLimit: c.perUserLimit !== null ? String(c.perUserLimit) : "",
      startDate: c.startDate,
      endDate: c.endDate,
      description: c.description,
      allowPartialConsumption: c.allowPartialConsumption ?? false,
      autoApply: c.autoApply ?? false,
      offerSubtype: c.offerSubtype ?? "discount",
      buyQuantity: c.buyQuantity != null ? String(c.buyQuantity) : "",
      getQuantity: c.getQuantity != null ? String(c.getQuantity) : "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    const isOfferAutoApply = form.type === "Offer" && form.autoApply;

    // Code: required for Discount, Voucher; optional for auto-applied Offer
    if (!isOfferAutoApply && !form.code.trim()) {
      errs.code = "Coupon code is required.";
    } else if (form.code.trim()) {
      const codeLower = form.code.trim().toLowerCase();
      if (
        !editingCoupon &&
        coupons.some((c) => c.code.toLowerCase() === codeLower)
      )
        errs.code = "Coupon code already exists.";
      else if (
        editingCoupon &&
        coupons.some(
          (c) =>
            c.id !== editingCoupon.id && c.code.toLowerCase() === codeLower,
        )
      )
        errs.code = "Coupon code already exists.";
    }

    // Discount value: not required for Buy X Get Y
    const isBuyXGetY =
      form.type === "Offer" && form.offerSubtype === "buyXgetY";
    if (!isBuyXGetY) {
      if (!form.discountValue || Number(form.discountValue) <= 0)
        errs.discountValue = "Value must be greater than 0.";
      if (
        form.discountKind === "percentage" &&
        Number(form.discountValue) > 100
      )
        errs.discountValue = "Percentage cannot exceed 100%.";
    }

    // Voucher: always fixed amount
    if (form.type === "Voucher" && form.discountKind === "percentage") {
      errs.discountKind = "Vouchers must use fixed amount.";
    }

    // Buy X Get Y: require buyQuantity and getQuantity
    if (isBuyXGetY) {
      const buyQ = Number(form.buyQuantity);
      const getQ = Number(form.getQuantity);
      if (!form.buyQuantity || buyQ < 1)
        errs.buyQuantity = "Buy quantity must be at least 1.";
      if (!form.getQuantity || getQ < 1)
        errs.getQuantity = "Get quantity must be at least 1.";
    }

    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.endDate) errs.endDate = "End date is required.";
    if (
      form.startDate &&
      form.endDate &&
      new Date(form.startDate) >= new Date(form.endDate)
    )
      errs.endDate = "End date must be after start date.";

    if (!form.allEvents && form.applicableEvents.length === 0)
      errs.applicableEvents = "Select at least one event or choose All Events.";

    if (form.usageLimit && Number(form.usageLimit) <= 0)
      errs.usageLimit = "Usage limit must be a positive number.";
    if (form.perUserLimit && Number(form.perUserLimit) <= 0)
      errs.perUserLimit = "Per-user limit must be a positive number.";
    if (form.maxCap && Number(form.maxCap) <= 0)
      errs.maxCap = "Max cap must be a positive number.";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    const isOfferAutoApply = form.type === "Offer" && form.autoApply;
    const isBuyXGetY =
      form.type === "Offer" && form.offerSubtype === "buyXgetY";

    const payload: Omit<Coupon, "id"> & { id?: string } = {
      id: editingCoupon?.id ?? `c${Date.now()}`,
      code: isOfferAutoApply ? "" : form.code.trim().toUpperCase(),
      type: form.type,
      discountKind: form.type === "Voucher" ? "fixed" : form.discountKind,
      discountValue: isBuyXGetY ? 0 : Number(form.discountValue),
      maxCap: form.maxCap ? Number(form.maxCap) : null,
      minTicketValue: form.minTicketValue ? Number(form.minTicketValue) : null,
      applicableEvents: form.allEvents ? [] : form.applicableEvents,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      usageCount: editingCoupon?.usageCount ?? 0,
      revenueImpact: editingCoupon?.revenueImpact ?? 0,
      discountImpact: editingCoupon?.discountImpact ?? 0,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "Active",
      description: form.description,
      createdAt: editingCoupon?.createdAt ?? new Date().toISOString(),
      ...(form.type === "Voucher" && {
        allowPartialConsumption: form.allowPartialConsumption,
      }),
      ...(form.type === "Offer" && {
        autoApply: form.autoApply,
        offerSubtype: form.offerSubtype,
        buyQuantity:
          isBuyXGetY && form.buyQuantity ? Number(form.buyQuantity) : null,
        getQuantity:
          isBuyXGetY && form.getQuantity ? Number(form.getQuantity) : null,
      }),
    };

    const displayName = payload.code || payload.description || "Offer";

    if (editingCoupon) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id ? ({ ...payload, id: c.id } as Coupon) : c,
        ),
      );
      toast({
        title: "Coupon Updated",
        description: `${payload.code ? `"${payload.code}"` : displayName} has been updated.`,
        variant: "success",
      });
      setIsSaving(false);
      setIsFormOpen(false);
      return;
    }

    // Create new coupon
    try {
      const auth = getAuth();
      const authUser = auth.currentUser;
      if (!authUser) {
        toast({
          title: "Error",
          description: "You must be logged in to create a coupon.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const idToken = await authUser.getIdToken();
      const { id: _id, ...couponBody } = payload;
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ coupon: couponBody }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.data ?? "Failed to create coupon");
      }

      const result = await response.json();
      const createdCoupon = result.coupon as Coupon;

      setCoupons((prev) => [createdCoupon, ...prev]);
      await mutate("/api/admin/coupons");
      toast({
        title: "Coupon Created",
        description: `${createdCoupon.code ? `"${createdCoupon.code}"` : displayName} has been created.`,
        variant: "success",
      });
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle enable/disable ───────────────────────────────────────────
  const toggleEnabled = (c: Coupon) => {
    const newStatus = c.status === "Disabled" ? "Active" : "Disabled";
    setCoupons((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)),
    );
    const displayName = c.code || c.description || "Offer";
    toast({
      title: newStatus === "Disabled" ? "Coupon Disabled" : "Coupon Enabled",
      description: `${c.code ? `"${c.code}"` : displayName} has been ${newStatus === "Disabled" ? "disabled" : "enabled"}.`,
    });
  };

  // ── Delete ──────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deletingCoupon) return;
    if (deletingCoupon.usageCount > 0) {
      toast({
        title: "Cannot Delete",
        description:
          "Coupon cannot be deleted after use. You may disable it instead.",
        variant: "destructive",
      });
      setIsDeleteOpen(false);
      setDeletingCoupon(null);
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
    const displayName =
      deletingCoupon.code || deletingCoupon.description || "Offer";
    toast({
      title: "Coupon Deleted",
      description: `${deletingCoupon.code ? `"${deletingCoupon.code}"` : displayName} has been permanently deleted.`,
      variant: "success",
    });
    setIsDeleteOpen(false);
    setDeletingCoupon(null);
  };

  // ── Export ──────────────────────────────────────────────────────────
  const exportData = (format: string) =>
    toast({
      title: "Export Started",
      description: `Exporting coupons to ${format.toUpperCase()} format...`,
      variant: "default",
    });

  // ── Event name lookup ───────────────────────────────────────────────
  const eventName = (id: string) =>
    events.find((e) => e.id === id)?.title ?? id;

  const toggleEventSelection = (eventId: string) => {
    setForm((prev) => ({
      ...prev,
      applicableEvents: prev.applicableEvents.includes(eventId)
        ? prev.applicableEvents.filter((e) => e !== eventId)
        : [...prev.applicableEvents, eventId],
    }));
  };

  return (
    <div className="p-4 md:p-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Coupons Management
          </h1>
          <p className="text-muted-foreground">
            Create, configure, monitor and control Offer incentives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create New Coupon
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-12">
          <span>Error loading coupons.</span>
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────── */}

      {data?.coupons && data?.coupons.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Coupons
                </CardTitle>
                <Tag className="h-4 w-4 text-orangeColor" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalActive}</div>
                <p className="text-xs text-muted-foreground">
                  of {liveCoupons.length} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue Impact
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orangeColor" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{price(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  From coupon-applied orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Discounts
                </CardTitle>
                <Percent className="h-4 w-4 text-orangeColor" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{price(totalDiscount)}</div>
                <p className="text-xs text-muted-foreground">
                  Total discount value granted
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Redemptions
                </CardTitle>
                <Gift className="h-4 w-4 text-orangeColor" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalUsage.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Times coupons applied
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Search & Filters ────────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by coupon code, event name, or description..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                  <SelectItem value="Fully Redeemed">Fully Redeemed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Discount">Discount</SelectItem>
                  <SelectItem value="Voucher">Voucher</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center">
                    <button
                      className="flex items-center justify-center gap-1 hover:text-foreground mx-auto"
                      onClick={() => toggleSort("code")}
                    >
                      Coupon Code <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Discount</TableHead>
                  <TableHead className="text-center">
                    Applicable Events
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      className="flex items-center justify-center gap-1 hover:text-foreground mx-auto"
                      onClick={() => toggleSort("usageCount")}
                    >
                      Usage <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      className="flex items-center justify-center gap-1 hover:text-foreground mx-auto"
                      onClick={() => toggleSort("revenueImpact")}
                    >
                      Revenue <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Discount Impact</TableHead>
                  <TableHead className="text-center">
                    <button
                      className="flex items-center justify-center gap-1 hover:text-foreground mx-auto"
                      onClick={() => toggleSort("startDate")}
                    >
                      Validity <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 my-12">
                        <div className="flex flex-col items-center gap-2 mb-6">
                          <Tag className="h-6 w-6 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No coupons found
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("all");
                            setTypeFilter("all");
                            setEventFilter("all");
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      {/* Code */}
                      <TableCell className="font-mono font-semibold text-center">
                        <div className="flex items-center justify-center gap-2">
                          {c.code ? (
                            <>
                              <span>{c.code}</span>
                              <button
                                onClick={() => copyCode(c.code)}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Copy code ${c.code}`}
                              >
                                {copiedCode === c.code ? (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Auto
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="text-center">
                        <Badge className={`gap-1 ${typeBadgeColor(c.type)}`}>
                          {typeIcon(c.type)}
                          {c.type}
                        </Badge>
                      </TableCell>

                      {/* Discount */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {c.type === "Offer" &&
                          c.offerSubtype === "buyXgetY" &&
                          c.buyQuantity != null &&
                          c.getQuantity != null ? (
                            <span className="text-sm">
                              Buy {c.buyQuantity} Get {c.getQuantity} Free
                            </span>
                          ) : c.discountKind === "percentage" ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Percent className="h-3.5 w-3.5 text-orangeColor" />
                                <span>{c.discountValue}%</span>
                              </div>
                              {c.maxCap !== null && (
                                <span className="text-[10px] text-muted-foreground">
                                  (max {price(c.maxCap)})
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-orangeColor" />
                              <span>{price(c.discountValue)}</span>
                            </div>
                          )}
                          {c.type === "Voucher" &&
                            c.allowPartialConsumption && (
                              <span className="text-[10px] text-muted-foreground">
                                Partial OK
                              </span>
                            )}
                        </div>
                      </TableCell>

                      {/* Applicable events */}
                      <TableCell className="text-center">
                        {c.applicableEvents.length === 0 ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Globe className="h-3.5 w-3.5 text-orangeColor" />
                            All Events
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-1">
                            {c.applicableEvents.slice(0, 2).map((eid) => (
                              <Badge
                                key={eid}
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {eventName(eid)}
                              </Badge>
                            ))}
                            {c.applicableEvents.length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                +{c.applicableEvents.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Usage */}
                      <TableCell className="text-center">
                        <span>
                          {c.usageCount}
                          {c.usageLimit !== null && (
                            <span className="text-muted-foreground">
                              {" "}
                              / {c.usageLimit}
                            </span>
                          )}
                        </span>
                      </TableCell>

                      {/* Revenue */}
                      <TableCell className="font-medium text-center">
                        {price(c.revenueImpact)}
                      </TableCell>

                      {/* Discount impact */}
                      <TableCell className="text-red-600 dark:text-red-400 text-center">
                        -{price(c.discountImpact)}
                      </TableCell>

                      {/* Validity */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center text-xs">
                          <span>{formatDateShort(new Date(c.startDate))}</span>
                          <span className="text-muted-foreground">
                            to {formatDateShort(new Date(c.endDate))}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge className={statusColor(c.status)}>
                          {c.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewingCoupon(c);
                                  setIsViewOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Coupon
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleEnabled(c)}
                              >
                                {c.status === "Disabled" ? (
                                  <>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    Enable Coupon
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="mr-2 h-4 w-4" />
                                    Disable Coupon
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setDeletingCoupon(c);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Coupon
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <ViewDetailsDialog
            open={isViewOpen}
            onOpenChange={setIsViewOpen}
            coupon={viewingCoupon}
            events={events}
          />

          <CreateEditDialog
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            editingCoupon={editingCoupon}
            events={events}
            isSaving={isSaving}
            onSave={handleSave}
            onToggleEventSelection={toggleEventSelection}
          />

          <DeleteConfirmationDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            coupon={deletingCoupon}
            onConfirmDelete={confirmDelete}
            onDisableInstead={() =>
              deletingCoupon && toggleEnabled(deletingCoupon)
            }
            onClose={() => {
              setIsDeleteOpen(false);
              setDeletingCoupon(null);
            }}
          />
        </>
      )}
    </div>
  );
}
