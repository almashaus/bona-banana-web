"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PDFViewer() {
  const searchParams = useSearchParams();
  const file = searchParams.get("file");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("PDF");

  if (!file) {
    return <div className="text-center m-10">No file provided</div>;
  }

  const pdfUrl = `/api/pdf?file=${encodeURIComponent(file)}`;

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 me-2 animate-spin text-redColor" />
          {t("loadingPDF")}
        </div>
      )}
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="PDF Viewer"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
