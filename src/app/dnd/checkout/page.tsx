"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  LockIcon,
  Swords,
  CalendarDays,
  Sparkles,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { useCampaignCheckoutStore } from "@/src/lib/stores/useCampaignCheckoutStore";
import { auth } from "@/src/lib/firebase/firebaseConfig";
import Loading from "@/src/components/ui/loading";
import { useTranslations, useLocale } from "next-intl";
import { roundMoney } from "@/src/lib/utils/utils";
import { paymentMethodsIds } from "@/src/data/appData";
import { price } from "@/src/lib/utils/locales";

type PaymentMethod = {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ImageUrl: string;
};

export default function CampaignCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations("DnD");
  const tCheckout = useTranslations("Checkout");
  const locale = useLocale();

  const campaign = useCampaignCheckoutStore((s) => s.campaign);
  const selectedPlayerId = useCampaignCheckoutStore((s) => s.selectedPlayerId);
  const selectedSessionIds = useCampaignCheckoutStore(
    (s) => s.selectedSessionIds,
  );
  const bookAll = useCampaignCheckoutStore((s) => s.bookAll);
  const totalAmount = useCampaignCheckoutStore((s) => s.totalAmount);
  const discountAmount = useCampaignCheckoutStore((s) => s.discountAmount);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number>(2);

  const subtotal = campaign
    ? roundMoney(campaign.price * selectedSessionIds.length)
    : 0;
  const finalTotal = totalAmount || roundMoney(subtotal - discountAmount);

  // Fetch payment methods
  useEffect(() => {
    if (finalTotal && finalTotal > 0) {
      const initiate = async () => {
        setIsLoading(true);
        const response = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceAmount: finalTotal,
            currencyIso: "SAR",
          }),
        });

        if (response.ok) {
          const jsonData = await response.json();
          setPaymentMethods(jsonData?.data?.Data?.PaymentMethods || []);
        }
        setIsLoading(false);
      };

      initiate();
    }
  }, [finalTotal]);

  if (!campaign || !selectedPlayerId || selectedSessionIds.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Swords className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold mb-4">{tCheckout("invalidInfo")}</h1>
        <Button onClick={() => router.push("/dnd")}>
          {t("backToCampaigns")}
        </Button>
      </div>
    );
  }

  const handlePayment = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setIsProcessing(true);

    try {
      const fbUser = auth.currentUser;
      if (!fbUser) {
        router.replace("/login");
        return;
      }
      const idToken = await fbUser.getIdToken();

      // Step 1: Create pending order + bookings
      const checkoutRes = await fetch("/api/campaign-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          sessionIds: selectedSessionIds,
          playerId: selectedPlayerId,
          bookAll,
          paymentMethod:
            paymentMethods.find((m) => m.PaymentMethodId === selectedMethod)
              ?.PaymentMethodEn || "MADA",
        }),
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json();
        toast({
          title: tCheckout("orderFailed"),
          description: err?.error || tCheckout("orderFailedDescription"),
          variant: "destructive",
        });
        return;
      }

      const { orderId } = await checkoutRes.json();

      // Step 2: Execute payment
      const payload = {
        paymentMethodId: selectedMethod,
        invoiceValue: finalTotal,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerReference: `campaign-${campaign.id}`,
        orderId,
        checkoutType: "campaign",
      };

      const execRes = await fetch("/api/payment/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const execJson = await execRes.json();
      if (!execRes.ok) throw new Error("Execute error");

      const redirectUrl = execJson?.data?.Data?.PaymentURL;
      if (!redirectUrl) throw new Error("Missing redirect url");

      window.location.href = redirectUrl;
    } catch {
      toast({
        title: tCheckout("paymentFailed"),
        description: tCheckout("pleaseCheckPaymentAndTryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-greenColor text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-end text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 mb-2 -ms-2"
          >
            {locale == "en" ? (
              <ArrowLeft className="h-4 w-4 me-2" />
            ) : (
              <ArrowRight className="h-4 w-4 me-2" />
            )}
            {t("backToCampaigns")}
          </Button>
          <h1 className="text-3xl font-bold">{tCheckout("checkout")}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order Summary */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                <FileText className="h-5 w-5 text-orangeColor" />
                {t("orderSummary")}
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium flex items-center gap-1">
                  <Swords className="h-5 w-5 text-orangeColor" />{" "}
                  {campaign.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {selectedSessionIds.length}{" "}
                  {bookAll ? t("allSessions") : t("selectedSessions")}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("pricePerSession")}
                  </span>
                  <span>{price(campaign.price, locale)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("discount")} ({t("bookAllDiscount")})
                    </span>
                    <span>-{price(discountAmount, locale)}</span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-lg">
                  <span>{t("totalPrice")}</span>
                  <span className="text-greenColor">
                    {price(finalTotal, locale)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xl font-semibold mb-4">
                <CreditCard className="h-5 w-5" />
                {tCheckout("paymentMethods")}
              </div>

              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loading />
                </div>
              )}

              {!isLoading && (
                <>
                  <div className="grid gap-2">
                    {paymentMethods.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        {tCheckout("noPaymentMethods")}
                      </div>
                    )}

                    {paymentMethods
                      .filter((m) =>
                        paymentMethodsIds.includes(m.PaymentMethodId),
                      )
                      .map((method) => (
                        <div
                          key={method.PaymentMethodId}
                          onClick={() =>
                            setSelectedMethod(method.PaymentMethodId)
                          }
                          className={`${selectedMethod === method.PaymentMethodId ? "border-2 border-orangeColor" : "border-muted-foreground/20"} border rounded-lg flex justify-between items-center p-2 cursor-pointer`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="paymentMethod"
                              className="accent-greenColor cursor-pointer"
                              value={String(method.PaymentMethodId)}
                              checked={
                                selectedMethod === method.PaymentMethodId
                              }
                              onChange={() =>
                                setSelectedMethod(method.PaymentMethodId)
                              }
                            />
                            <img
                              src={method.ImageUrl}
                              alt={method.PaymentMethodEn}
                              className="ms-3 me-2"
                              width={50}
                              height={10}
                            />
                            <Label className="cursor-pointer">
                              {method.PaymentMethodEn}
                            </Label>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                      onClick={handlePayment}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 animate-pulse" />
                          {tCheckout("processing")}
                        </span>
                      ) : (
                        <span>
                          {tCheckout("pay")} {price(finalTotal, locale)}
                        </span>
                      )}
                    </Button>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <LockIcon className="w-3 h-3" /> {tCheckout("securePay")}
                      <img
                        src="/images/MF-logo.svg"
                        alt="My Fatoorah Logo"
                        className="h-3"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
