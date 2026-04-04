"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  FileCog,
  HardDrive,
  Languages,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { price } from "@/src/lib/utils/locales";
import { roundMoney } from "@/src/lib/utils/utils";
import { useLocale, useTranslations } from "next-intl";
import EmblaCarousel from "@/src/app/(components)/emblaCarousel";
import useSWR from "swr";
import Loading from "@/src/components/ui/loading";
import { useProductCheckoutStore } from "@/src/lib/stores/useProductCheckoutStore";
import { useAuth } from "@/src/features/auth/auth-provider";

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductPageClient() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const t = useTranslations("Product");
  const slug = params?.slug;

  const {
    data: product,
    error,
    isLoading,
  } = useSWR<DigitalProduct>(slug ? `/api/products/${slug}` : null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    discountType: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!product || !couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponInput.trim(),
          eventId: product.id,
          ticketQuantity: 1,
          cartSubtotal: product.price,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          id: data.couponId,
          code: data.couponCode,
          discountAmount: data.discountAmount ?? 0,
          discountType: data.discountType ?? "fixed",
        });
        setCouponInput("");
      } else {
        setCouponError(
          data.errorMessage === "couponInvalid"
            ? t("invalidCouponCode")
            : data.errorMessage === "missingRequiredFields"
              ? t("missingRequiredFields")
              : t("couponCouldNotBeApplied"),
        );
      }
    } catch {
      setCouponError(t("failedToValidateCoupon"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleContinueToCheckout = () => {
    if (!product) return;

    useProductCheckoutStore.setState({
      product,
      quantity: 1,
      couponId: appliedCoupon?.id ?? null,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount: appliedCoupon?.discountAmount ?? 0,
      discountType: appliedCoupon?.discountType ?? null,
    });

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/product-checkout")}`);
      return;
    }

    router.push("/product-checkout");
  };

  const finalPrice = product
    ? roundMoney(product.price - (appliedCoupon?.discountAmount ?? 0))
    : 0;

  const productImages: string[] = product?.images?.length
    ? [product.coverImage, ...product.images]
    : product?.coverImage
      ? [product.coverImage]
      : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loading />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("productNotFound")}</p>
        <Button asChild>
          <Link href="/">{t("backToHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-200/40 to-stone-50/50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-start gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            {locale === "en" ? (
              <ArrowLeft className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
          <h1 className="text-3xl font-bold">
            {locale === "en" ? product.title : product.titleAr}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-1">
          {/* 1. Product Media Display */}
          <div className="space-y-4">
            <EmblaCarousel images={productImages} options={{ loop: true }} />
          </div>

          <div className="space-y-6">
            {/* 2. Product Information (Description, File Details) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">
                  {locale === "en" ? product.title : product.titleAr}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-10">
                <div className="space-y-3">
                  {product.description && (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {locale === "en"
                        ? product.description
                        : product.descriptionAr}
                    </p>
                  )}
                </div>

                <div className="flex flex-row justify-around  md:px-24 gap-8 border rounded-lg p-2">
                  {product.downloadableFile?.fileFormat && (
                    <div className="flex flex-col items-center gap-3 text-xs md:text-sm ">
                      <div className="flex flex-row items-center gap-1 text-orangeColor">
                        <FileCog className="h-4 w-4  shrink-0" />
                        <span className="hidden sm:inline">{t("format")}</span>
                      </div>
                      <span>{product.downloadableFile?.fileFormat}</span>
                    </div>
                  )}

                  {product.downloadableFile?.fileSize && (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-3 text-xs md:text-sm">
                        <div className="flex flex-row items-center gap-1 text-orangeColor">
                          <HardDrive className="h-4 w-4  shrink-0" />
                          <span className="hidden sm:inline">{t("size")}</span>
                        </div>
                        <span>
                          {formatFileSize(product.downloadableFile?.fileSize)}
                        </span>
                      </div>
                    </div>
                  )}

                  {product.downloadableFile?.filePageCount && (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-3 text-xs md:text-sm">
                        <div className="flex flex-row items-center gap-1 text-orangeColor">
                          <BookOpenText className="h-4 w-4  shrink-0" />
                          <span className="hidden sm:inline">{t("pages")}</span>
                        </div>
                        <span>{product.downloadableFile?.filePageCount}</span>
                      </div>
                    </div>
                  )}

                  {product.downloadableFile?.language && (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-3 text-xs md:text-sm">
                        <div className="flex flex-row items-center gap-1 text-orangeColor">
                          <Languages className="h-4 w-4  shrink-0" />
                          <span className="hidden sm:inline">
                            {t("language")}
                          </span>
                        </div>
                        <span>{product.downloadableFile?.language}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 4. Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("pricing")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("price")}</span>
                  <span className="text-2xl font-bold">
                    {price(product.price, locale)}
                  </span>
                </div>

                {/* Coupon Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("couponCode")}
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-green-600">{t("applied")}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="p-0 text-green-700 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t("enterCouponCode")}
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponError) setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        disabled={couponLoading}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="shrink-0 px-4"
                      >
                        {couponLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("apply")
                        )}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-sm text-red-500">{couponError}</p>
                  )}
                </div>

                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>{t("couponDiscount")}</span>
                      <span>
                        -{price(appliedCoupon.discountAmount, locale)}
                      </span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between font-bold text-lg">
                  <span>{t("totalPrice")}</span>
                  <span>{price(finalPrice, locale)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleContinueToCheckout}
                >
                  {t("continueToCheckout")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
