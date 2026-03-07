"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import Loading from "@/src/components/ui/loading";
import { useTranslations } from "next-intl";

function ProductCheckoutError() {
  const search = useSearchParams();
  const paymentId = search?.get("paymentId");
  const t = useTranslations("Checkout");
  const tHome = useTranslations("Home");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paymentId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/payment/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });

        if (!res.ok) throw new Error("Status fetch failed");
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentId]);

  if (!paymentId)
    return (
      <div className="container py-10 text-center">
        No payment id found in URL
      </div>
    );

  return (
    <div className="flex justify-center m-10">
      <Card className="w-fit lg:w-1/3 px-10">
        {loading ? (
          <div className="flex flex-col justify-center items-center text-center py-12 space-y-4">
            <Loading />

            <p className="text-2xl font-medium">{t("checkingPaymentStatus")}</p>
            <p className="text-sm text-muted-foreground pb-6">
              {t("keepTapOpen")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center text-center py-12 space-y-4">
            <img
              src="/images/payment-error.svg"
              alt="Payment Error"
              width={80}
            />
            <div className="space-y-3">
              <p className="text-2xl font-medium">{t("paymentFailed")}</p>

              <p className="text-muted-foreground">
                {t("pleaseCheckPaymentAndTryAgain")}
              </p>
            </div>
            <Button className="mt-24" asChild>
              <a href="/">{tHome("backToHome")}</a>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ProductCheckoutErrorPage() {
  return (
    <Suspense>
      <ProductCheckoutError />
    </Suspense>
  );
}
