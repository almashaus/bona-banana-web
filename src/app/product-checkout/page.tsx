"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  FileText,
  LockIcon,
  Package,
  Tag,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { useToast } from "@/src/components/ui/use-toast";
import { generateIDNumber } from "@/src/lib/utils/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { ProductOrder, ProductOrderStatus } from "@/src/models/productOrder";
import Loading from "@/src/components/ui/loading";
import { useProductCheckoutStore } from "@/src/lib/stores/useProductCheckoutStore";
import { mutate } from "swr";
import { price } from "@/src/lib/utils/locales";
import { roundMoney } from "@/src/lib/utils/utils";
import { paymentMethodsIds } from "@/src/data/appData";
import { useLocale, useTranslations } from "next-intl";

type PaymentMethod = {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ImageUrl: string;
};

export default function ProductCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations("Checkout");
  const tProduct = useTranslations("Product");
  const tCoupon = useTranslations("Coupon");
  const tHome = useTranslations("Home");
  const locale = useLocale();

  const storedProduct = useProductCheckoutStore((state) => state.product);
  const quantity = useProductCheckoutStore((state) => state.quantity);
  const couponId = useProductCheckoutStore((state) => state.couponId);
  const couponCode = useProductCheckoutStore((state) => state.couponCode);
  const storedCouponDiscount = useProductCheckoutStore(
    (state) => state.discountAmount,
  );
  const discountType = useProductCheckoutStore((state) => state.discountType);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number>(2);
  const [product, setProduct] = useState<DigitalProduct | null>(null);

  useEffect(() => {
    if (storedProduct) {
      setProduct(storedProduct as DigitalProduct);
    }
  }, [storedProduct]);

  const rawSubtotal = roundMoney((product?.price ?? 0) * quantity);
  const hasCoupon = couponId !== null && storedCouponDiscount > 0;
  const couponDiscountAmount = hasCoupon ? roundMoney(storedCouponDiscount) : 0;
  const total = roundMoney(rawSubtotal - couponDiscountAmount);

  useEffect(() => {
    if (total && total > 0) {
      const initiate = async () => {
        setIsLoading(true);
        const response = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceAmount: total,
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
  }, [total]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!user) {
      setIsProcessing(false);
      router.replace(
        `/login?redirect=${encodeURIComponent("/product-checkout")}`,
      );
      return;
    }

    const orderId = generateIDNumber("PRODUCT-ORDER");

    const order: ProductOrder = {
      id: orderId,
      productId: product?.id!,
      userId: user.id,
      price: total,
      orderDate: new Date(),
      status: ProductOrderStatus.PENDING,
      couponId: couponId ?? null,
      discountAmount: couponDiscountAmount,
      discountType: discountType ?? null,
      paymentMethod:
        paymentMethods.find((m) => m.PaymentMethodId === selectedMethod)
          ?.PaymentMethodEn || "MADA",
    };

    const response = await fetch("/api/product-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      toast({
        title: t("orderFailed") || "Order Failed",
        description:
          t("orderFailedDescription") ||
          "Failed to create order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    await mutate("/api/admin/products");
    await mutate(`/api/admin/products/${product?.id}/orders`);
    await mutate("/api/published-products");

    try {
      const payload = {
        paymentMethodId: selectedMethod,
        invoiceValue: total,
        customerName: user.name,
        customerEmail: user.email,
        customerReference: `product-${product?.slug}`,
        orderId,
        checkoutType: "product",
      };

      const res = await fetch("/api/payment/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error("Execute error");

      const redirectUrl = json?.data?.Data?.PaymentURL;

      if (!redirectUrl) throw new Error("Missing redirect url from gateway");

      window.location.href = redirectUrl;
    } catch (err: unknown) {
      toast({
        title: "Payment Failed",
        description:
          "Something went wrong on the payment. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!product?.id) {
    return (
      <div className="container pt-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {t("invalidInfo") || "Invalid checkout information"}
        </h1>
        <p className="mb-6">
          {tProduct("productNotFound") ||
            "Please select a product before proceeding to checkout."}
        </p>
        <Button asChild>
          <a href="/">{tHome("allProducts")}</a>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-start gap-4 mb-5">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          {locale === "en" ? (
            <ArrowLeft className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
        <h1 className="text-3xl font-bold">{t("checkout")}</h1>
      </div>
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-end gap-1 text-xl font-semibold mb-4">
              <FileText />
              {t("summary")}
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="h-20 w-20 overflow-hidden rounded-md shrink-0">
                <img
                  src={
                    product.coverImage?.trim()
                      ? product.coverImage
                      : "/images/product/Digital-Product.png"
                  }
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {locale === "en" ? product.title : product.titleAr}
                </h3>
                <div className="flex items-center text-sm mt-1">
                  <Package className="me-1 h-4 w-4 text-redColor" />
                  {quantity} {quantity === 1 ? "item" : "items"}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <FileText className="me-1 h-4 w-4 text-redColor" />
                  {locale === "en"
                    ? product.categoryName?.en
                    : product.categoryName?.ar}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              {hasCoupon && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal") || "Subtotal"}
                    </span>
                    <span>{price(rawSubtotal, locale)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {tCoupon("couponDiscount") || "Coupon Discount"}
                      {couponCode && (
                        <span className="font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">
                          {couponCode}
                        </span>
                      )}
                    </span>
                    <span>-{price(couponDiscountAmount, locale)}</span>
                  </div>

                  <Separator className="my-2" />
                </>
              )}
              <div className="flex justify-between font-bold">
                <span>{tProduct("totalPrice")}</span>
                <span>{price(total, locale)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-white rounded-lg border p-6 shadow-sm"
          >
            <div className="flex items-end gap-1 text-xl font-semibold mb-4">
              <CreditCard />
              {t("paymentMethods")}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loading />
              </div>
            )}

            {paymentMethods && !isLoading && (
              <>
                <div className="grid gap-2">
                  {paymentMethods.length === 0 && (
                    <div>{t("noPaymentMethods")}</div>
                  )}

                  {paymentMethods
                    .filter((m) =>
                      paymentMethodsIds.includes(m.PaymentMethodId),
                    )
                    .map((method: PaymentMethod) => (
                      <div
                        key={method.PaymentMethodId}
                        onClick={() =>
                          setSelectedMethod(method.PaymentMethodId)
                        }
                        className={`${selectedMethod === method.PaymentMethodId ? "border-2 border-orangeColor" : " border-muted-foreground/20"} border rounded-lg flex justify-between items-center p-2 cursor-pointer`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            className="accent-greenColor cursor-pointer"
                            value={String(method.PaymentMethodId)}
                            checked={selectedMethod === method.PaymentMethodId}
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
                          <Label
                            htmlFor={String(method.PaymentMethodId)}
                            className="cursor-pointer"
                          >
                            {method.PaymentMethodEn}
                          </Label>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="mt-6 w-full space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 animate-pulse" />
                        {t("processing") || "Processing..."}
                      </span>
                    ) : (
                      <span>
                        {t("pay")} {price(total, locale)}
                      </span>
                    )}
                  </Button>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    <LockIcon className="w-3 h-3" /> {t("securePay")}{" "}
                    <img
                      src="/images/MF-logo.svg"
                      alt="My Fatoorah Logo"
                      className="h-3"
                    />
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
