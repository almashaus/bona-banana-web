"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-provider";
import { mutate } from "swr";
import Loading from "@/src/components/ui/loading";
import {
  TriangleAlert,
  CheckCircle,
  Swords,
  CalendarDays,
  Coins,
  MapPin,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { useCampaignCheckoutStore } from "@/src/lib/stores/useCampaignCheckoutStore";
import { Campaign } from "@/src/models/campaign/campaign";
import { formatDateTime } from "@/src/lib/utils/formatDate";
import { price } from "@/src/lib/utils/locales";

const POLL_INTERVAL_MS = 3000;

function CampaignCheckoutResult() {
  const search = useSearchParams();
  const paymentId = search?.get("paymentId");
  const orderId = search?.get("orderId");
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const tDnD = useTranslations("DnD");
  const resetStore = useCampaignCheckoutStore((s) => s.reset);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    sessionIds: string[];
    totalAmount: number;
    discountAmount: number;
    sessions: { id: string; sessionNumber: number; dateTime: string }[];
  } | null>(null);
  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const hasUpdatedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
  } | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error("Status fetch failed");
      return await res.json();
    } catch {
      setError({
        title: t("warning"),
        message: t("somethingWentWrong"),
      });
      setLoading(false);
      return null;
    }
  }

  // Poll
  useEffect(() => {
    if (!polling || !paymentId) return;

    const interval = setInterval(async () => {
      setAttempts((a) => a + 1);
      const result = await fetchStatus();
      const status = result?.data?.Data?.InvoiceStatus;

      if (status && status !== "Pending") {
        clearInterval(interval);
        setPolling(false);
      }
      if (attempts > 5) {
        clearInterval(interval);
        setPolling(false);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [polling, paymentId, attempts]);

  // Handle result
  useEffect(() => {
    if (!paymentId) return;

    (async () => {
      const result = await fetchStatus();
      const status = result?.data?.Data?.InvoiceStatus;

      if (status === "Paid") {
        if (!hasUpdatedRef.current) {
          hasUpdatedRef.current = true;
          try {
            const updateRes = await fetch("/api/campaign-checkout", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });

            if (!updateRes.ok) {
              hasUpdatedRef.current = false;
              throw new Error("Update failed");
            }
            const responseData = await updateRes.json();

            await mutate(`/api/campaigns`);
            resetStore();
            setCampaign(responseData.campaign);
            setOrderDetails(responseData.order ?? null);
            setLoading(false);
            setSuccess(true);
          } catch {
            setError({
              title: t("warning"),
              message: t("somethingWentWrong"),
            });
            setLoading(false);
          }
        }
      } else if (status === "Pending" && !polling) {
        setLoading(false);
        setError({
          title: t("paymentPending"),
          message: t("paymentPendingContactSupport"),
        });
      } else if (status === "Canceled" && !polling) {
        // Cancel the order
        await fetch("/api/campaign-checkout", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        setLoading(false);
        setError({
          title: t("paymentCanceled"),
          message: t("paymentCanceledNoChargesMade"),
        });
      }
    })();
  }, [paymentId, user, polling, orderId]);

  if (!paymentId) {
    return (
      <div className="container py-24 text-center">No payment ID found</div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-muted/30">
      {loading && (
        <Card className="w-full max-w-md">
          <div className="flex flex-col justify-center items-center text-center py-12 px-8 space-y-4">
            <Loading />
            <p className="text-2xl font-medium">{t("checkingPaymentStatus")}</p>
            <p className="text-sm text-muted-foreground">{t("keepTapOpen")}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="w-full max-w-md">
          <div className="flex flex-col justify-center items-center text-center py-12 px-8 space-y-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{tDnD("bookingConfirmed")}</p>
            <p className="text-sm text-muted-foreground">
              {tDnD("orderNo")} : {orderId}
            </p>

            {/* Campaign details */}
            <div className="w-full rounded-lg bg-muted/50 border p-4 space-y-3 text-start">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-orangeColor shrink-0" />
                <span className="font-medium">{campaign?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orangeColor shrink-0" />
                <span className="text-muted-foreground">
                  {locale == "en" ? campaign?.city.en : campaign?.city.ar}
                </span>
              </div>
              {orderDetails && (
                <>
                  {/* Session dates */}
                  <div className="space-y-3">
                    {orderDetails.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <CalendarDays className="h-4 w-4 text-orangeColor shrink-0 mt-0.5" />
                        <span>
                          {tDnD("sessionNo", {
                            number: session.sessionNumber,
                          })}
                          {" : "}
                          {session.dateTime
                            ? formatDateTime(new Date(session.dateTime))
                            : "TBD"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Discount */}
                  {orderDetails.discountAmount > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Coins className="h-4 w-4 text-orangeColor shrink-0" />
                      <span>
                        {tDnD("discount")}: -
                        {price(orderDetails.discountAmount, locale)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center gap-2 font-semibold text-greenColor border-t pt-3">
                    <Coins className="h-4 w-4 text-orangeColor shrink-0" />
                    <span>
                      {tDnD("totalPrice")}:{" "}
                      {price(orderDetails.totalAmount, locale)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <Button onClick={() => router.push("/dnd")}>
              {tDnD("backToCampaigns")}
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="w-full max-w-md">
          <div className="flex flex-col justify-center items-center text-center py-12 px-8">
            <div className="p-3 rounded-full bg-red-50 mb-2">
              <TriangleAlert className="w-8 h-8 text-redColor" />
            </div>
            <div className="mt-2 mb-6 space-y-2">
              <p className="text-2xl font-medium">{error.title}</p>
              <p className="text-base text-muted-foreground">{error.message}</p>
            </div>
            <Button onClick={() => router.push("/dnd")} variant="outline">
              {tDnD("backToCampaigns")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function CampaignCheckoutResultPage() {
  return (
    <Suspense>
      <CampaignCheckoutResult />
    </Suspense>
  );
}
