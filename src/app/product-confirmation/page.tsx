"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Download, Package } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { DigitalProduct } from "@/src/models/digitalProduct";
import useSWR from "swr";
import { ProductOrder } from "@/src/models/productOrder";
import Loading from "@/src/components/ui/loading";
import { price } from "@/src/lib/utils/locales";
import { useLocale, useTranslations } from "next-intl";

interface ProductOrderResponse {
  order: ProductOrder;
  product: DigitalProduct;
}

function ProductConfirmation() {
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [order, setOrder] = useState<ProductOrder | null>(null);

  const router = useRouter();
  const t = useTranslations("Confirm");
  const tProduct = useTranslations("Product");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("orderNumber");

  useEffect(() => {
    if (!orderNumber) {
      router.push("/");
    }
  }, [orderNumber, router]);

  const { data, error, isLoading } = useSWR<ProductOrderResponse>(
    orderNumber ? `/api/product-order?orderNumber=${orderNumber}` : null,
  );

  useEffect(() => {
    if (data) {
      setOrder(data.order);
      setProduct(data.product);
    }
  }, [data]);

  if (error) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Invalid confirmation information
        </h1>
        <p className="mb-6">We couldn&apos;t find the details for your order</p>
        <Button asChild>
          <Link href="/">{tHome("backToHome")}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !product || !order || !orderNumber) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading />
      </div>
    );
  }

  const hasDownload = product.downloadableFile?.fileUrl;

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">{t("confirm")}</h1>
          <p className="text-muted-foreground mt-2">{t("orderPurchase")}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-md shrink-0">
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
                  <div className="text-xl font-semibold">
                    {locale === "en" ? product.title : product.titleAr}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Package className="me-1 h-4 w-4" />
                    Digital Product
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm text-muted-foreground">
                  {t("orderNumber")}
                </div>
                <div className="font-medium">{orderNumber}</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between font-bold">
                <span>{tProduct("totalPrice")}</span>
                <span>{price(Number(order.price.toFixed(2)), locale)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {hasDownload && (
            <Button asChild className="flex items-center gap-2">
              <a
                href={product.downloadableFile!.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" />
                {t("download")} {product.downloadableFile!.fileName || "File"}
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">{tHome("backToHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductConfirmationPage() {
  return (
    <Suspense>
      <ProductConfirmation />
    </Suspense>
  );
}
