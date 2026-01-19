"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Image as ImageIcon, TriangleAlert, UploadIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/src/lib/firebase/firebaseConfig";

type GalleryKeys = "image1" | "image2" | "image3" | "image4" | "image5";
type GalleryImages = Record<GalleryKeys, string>;

type ImagesApiResponse = {
  images: Partial<GalleryImages>;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return (await res.json()) as ImagesApiResponse;
};

const STORAGE_DIR = "gallery";

const STORAGE_OBJECTS: Record<GalleryKeys, string> = {
  image1: `${STORAGE_DIR}/image1`,
  image2: `${STORAGE_DIR}/image2`,
  image3: `${STORAGE_DIR}/image3`,
  image4: `${STORAGE_DIR}/image4`,
  image5: `${STORAGE_DIR}/image5`,
};

const DEFAULT_IMAGES: GalleryImages = {
  image1: "",
  image2: "",
  image3: "",
  image4: "",
  image5: "",
};

const ImagesGallery = () => {
  const { data, error, isLoading, mutate } = useSWR<ImagesApiResponse>(
    "/api/images",
    fetcher,
  );

  const [images, setImages] = useState<GalleryImages>(DEFAULT_IMAGES);

  const pendingFilesRef = useRef<Partial<Record<GalleryKeys, File>>>({});
  const previewUrlsRef = useRef<Partial<Record<GalleryKeys, string>>>({});

  const [imagesAreSaving, setImagesAreSaving] = useState(false);

  useEffect(() => {
    const apiImages = data?.images ?? {};
    if (!apiImages) return;

    setImages((prev) => ({
      image1: apiImages.image1 ?? prev.image1,
      image2: apiImages.image2 ?? prev.image2,
      image3: apiImages.image3 ?? prev.image3,
      image4: apiImages.image4 ?? prev.image4,
      image5: apiImages.image5 ?? prev.image5,
    }));
  }, [data]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, []);

  const pickFile = (key: GalleryKeys) => {
    document.getElementById(key)?.click();
  };

  const onFileChange =
    (key: GalleryKeys) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      pendingFilesRef.current[key] = file;

      const prev = previewUrlsRef.current[key];
      if (prev) URL.revokeObjectURL(prev);

      const blobUrl = URL.createObjectURL(file);
      previewUrlsRef.current[key] = blobUrl;

      setImages((prevImages) => ({
        ...prevImages,
        [key]: blobUrl,
      }));

      e.target.value = "";
    };

  // Upload selected files to Firebase Storage and return the new download URLs
  const saveImagesToFirebaseStorage = async (): Promise<
    Partial<GalleryImages>
  > => {
    const keys: GalleryKeys[] = [
      "image1",
      "image2",
      "image3",
      "image4",
      "image5",
    ];
    const uploaded: Partial<GalleryImages> = {};

    for (const key of keys) {
      const file = pendingFilesRef.current[key];
      if (!file) continue;

      const objectPath = STORAGE_OBJECTS[key];
      const objectRef = ref(storage, objectPath);

      // Upload and then get URL
      await uploadBytes(objectRef, file, {
        contentType: file.type || "image/*",
      });

      const url = await getDownloadURL(objectRef);
      uploaded[key] = url;
    }

    return uploaded;
  };

  /**
   * Save flow:
   * 1) Upload selected files to Firebase Storage (client SDK) -> get download URLs
   * 2) POST URLs to Next API (/api/images) so your app can persist the chosen URLs
   * 3) SWR mutate to refresh UI
   */
  const handleSaveImages = async () => {
    try {
      setImagesAreSaving(true);

      const uploadedUrls = await saveImagesToFirebaseStorage();

      if (Object.keys(uploadedUrls).length === 0) {
        setImagesAreSaving(false);
        return;
      }

      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploadedUrls }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save images: ${res.status}`);
      }

      // Clear pending after successful save
      pendingFilesRef.current = {};

      // replace blob previews with real download URLs
      setImages((prev) => ({
        ...prev,
        ...uploadedUrls,
      }));

      // Refresh SWR cache
      await mutate();
    } finally {
      setImagesAreSaving(false);
    }
  };

  const ImageSlot = ({
    keyName,
    className,
  }: {
    keyName: GalleryKeys;
    className: string;
  }) => (
    <div className={`${className} rounded-xl relative`}>
      {images[keyName] ? (
        <img
          className="size-full object-cover object-center rounded-xl"
          src={images[keyName]}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="bg-muted size-full object-cover object-center" />
      )}
      <input
        type="file"
        id={keyName}
        accept="image/*"
        className="hidden"
        onChange={onFileChange(keyName)}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={imagesAreSaving}
        className="absolute bottom-1 right-1 h-7 px-2 text-xs"
        onClick={() => pickFile(keyName)}
      >
        <UploadIcon className="w-4 h-4 text-redColor" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
        <Card className="w-min">
          <CardHeader className="flex flex-row justify-center items-center space-y-0 pb-2">
            <CardTitle className="flex justify-center items-center me-1 text-xl font-medium">
              <ImageIcon className="h-5 w-5 me-2 text-redColor" /> Gallery
              Images
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-8">
            {error ? (
              <p className="text-sm text-red-600 mt-2">
                Failed to load images settings.
              </p>
            ) : null}
            {isLoading ? (
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            ) : null}

            <div className="grid h-[300px] w-[450px] lg:h-[600px] lg:w-[900px] grid-cols-8 grid-rows-6 gap-4 lg:m-8">
              {/* Big left [1] */}
              <ImageSlot keyName="image1" className="col-span-6 row-span-4" />

              {/* Right column [2] */}
              <ImageSlot keyName="image2" className="col-span-2 row-span-3" />

              {/* Right column [3] */}
              <ImageSlot keyName="image3" className="col-span-2 row-span-3" />

              {/* Bottom left [4] */}
              <ImageSlot keyName="image4" className="col-span-3 row-span-2" />

              {/* Bottom right [5] */}
              <ImageSlot keyName="image5" className="col-span-3 row-span-2" />
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button onClick={handleSaveImages} disabled={imagesAreSaving}>
                {imagesAreSaving ? "Uplaoding..." : "Uplaod Images"}
              </Button>
              <p className="flex text-xs text-muted-foreground">
                <TriangleAlert className="w-4 h-4 me-1" /> Upload the changes to
                the storage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImagesGallery;
