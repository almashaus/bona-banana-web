"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-provider";
import { mutate } from "swr";
import Loading from "@/src/components/ui/loading";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { sendEmailToSupport } from "@/src/lib/utils/sendEmailToSupport";
import { useTranslations } from "next-intl";

const POLL_INTERVAL_MS = 3000;

function ProductCheckoutResult() {
  const search = useSearchParams();
  const paymentId = search?.get("paymentId");
  const orderId = search?.get("orderId");
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("Checkout");
  const tFooter = useTranslations("Footer");
  const tHome = useTranslations("Home");

  const [polling, setPolling] = useState(true);
  const [attempts, setAttempts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    title: string;
    message: string;
    contactSupport: boolean;
  } | null>(null);

  async function fetchStatus() {
    try {
      const statusResponse = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      if (!statusResponse.ok) throw new Error("Status fetch failed");

      const json = await statusResponse.json();

      return json;
    } catch {
      setError({
        title: t("warning"),
        message: t("somethingWentWrong"),
        contactSupport: false,
      });
      setLoading(false);
    }
  }

  // Poll until status changes
  useEffect(() => {
    if (!polling || !paymentId) return;

    const interval = setInterval(async () => {
      setAttempts((a) => a + 1);
      const result = await fetchStatus();

      const currentStatus = result?.data?.Data?.InvoiceStatus;
      if (currentStatus && currentStatus !== "Pending") {
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

  // Update product order if status is Paid
  useEffect(() => {
    if (!paymentId) return;

    (async () => {
      try {
        const result = await fetchStatus();

        if (result?.data?.Data?.InvoiceStatus === "Paid" && user?.email) {
          const updateResponse = await fetch("/api/product-checkout", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderId,
              email: user.email,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error("Error in updating order");
          }

          await mutate("/api/admin/products");
          await mutate("/api/published-products");

          router.replace(`/product-confirmation?orderNumber=${orderId}`);
        }
        if (result?.data?.Data?.InvoiceStatus === "Pending" && !polling) {
          setLoading(false);
          setError({
            title: t("paymentPending"),
            message: t("paymentPendingContactSupport"),
            contactSupport: true,
          });
        }
        if (result?.data?.Data?.InvoiceStatus === "Canceled" && !polling) {
          setLoading(false);
          setError({
            title: t("paymentCanceled"),
            message: t("paymentCanceledNoChargesMade"),
            contactSupport: false,
          });
        }
      } catch {
        setError({
          title: t("warning"),
          message: t("somethingWentWrong"),
          contactSupport: false,
        });
        setLoading(false);
      }
    })();
  }, [paymentId, user, polling, orderId]);

  if (!paymentId)
    return (
      <div className="container py-10 text-center">
        No payment id found in URL
      </div>
    );

  return (
    <div className="flex justify-center m-10">
      {loading && (
        <Card className="w-fit lg:w-1/3 px-10">
          <div className="flex flex-col justify-center items-center text-center py-12 space-y-4">
            <Loading />

            <p className="text-2xl font-medium">{t("checkingPaymentStatus")}</p>
            <p className="text-sm text-muted-foreground">{t("keepTapOpen")}</p>
          </div>
        </Card>
      )}
      {error && (
        <Card className="w-fit lg:w-1/3 px-10">
          <div className="flex flex-col justify-center items-center text-center py-12">
            <TriangleAlert className="w-10 h-10 text-redColor" />
            <div className="mt-2 mb-6 space-y-3">
              <p className="text-2xl font-medium">{error.title}</p>
              <p className="text-lg text-muted-foreground">{error.message}</p>
              {error.contactSupport && (
                <a
                  href={sendEmailToSupport(paymentId ?? "", user?.email ?? "")}
                  className="underline text-green-700 hover:text-green-600"
                >
                  {tFooter("contactUs")}
                </a>
              )}
            </div>
            <Button asChild>
              <a href="/">{tHome("backToHome")}</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ProductCheckoutResultPage() {
  return (
    <Suspense>
      <ProductCheckoutResult />
    </Suspense>
  );
}
