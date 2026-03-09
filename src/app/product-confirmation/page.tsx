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
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/src/lib/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useToast } from "@/src/components/ui/use-toast";

interface ProductOrderResponse {
  order: ProductOrder;
  product: DigitalProduct;
}

function ProductConfirmation() {
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [order, setOrder] = useState<ProductOrder | null>(null);
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("Confirm");
  const tProduct = useTranslations("Product");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("orderNumber");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch(
        `/api/product-order/download?productId=${product.id}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total > 0) {
          setDownloadProgress(Math.round((loaded / total) * 100));
        } else {
          setDownloadProgress((prev) => Math.min(prev + 15, 90));
        }
      }

      setDownloadProgress(100);
      const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition
          ?.split("filename=")[1]
          ?.trim()
          .replace(/^["']|["']$/g, "") ||
        product.downloadableFile?.fileName ||
        "download.pdf";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Failed to download the file",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
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
                <span>{price(order.price, locale)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          variant="link"
          className="text-center text-sm hover:text-muted-foreground mb-6 underline"
          asChild
        >
          <Link href="/profile?tab=purchases">{t("accessPurchases")}</Link>
        </Button>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {hasDownload &&
            (isDownloading ? (
              <Button className="flex items-center gap-2" disabled>
                <span className="font-medium">%{downloadProgress}</span>
              </Button>
            ) : (
              <Button
                className="flex items-center gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                {t("download")} {product.downloadableFile!.fileName || "File"}
              </Button>
            ))}
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
