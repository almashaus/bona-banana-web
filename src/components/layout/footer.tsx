"use client";

import { usePathname } from "next/navigation";
import { MailIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

const BONA_PHONE = process.env.NEXT_PUBLIC_BONA_PHONE;
const BONA_EMAIL = process.env.NEXT_PUBLIC_BONA_EMAIL;
const BONA_INSTAGRAM = process.env.NEXT_PUBLIC_BONA_INSTAGRAM;

export default function Footer() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const t = useTranslations("Footer");

  return (
    <div>
      {!isAdminRoute && (
        <footer className="bg-stone-900 text-white py-6 space-y-8">
          <div className="container flex flex-col items-center justify-between gap-6 ">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="Bona Banana Logo"
                width={80}
                height={80}
              />
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a
                href={`https://wa.me/${BONA_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <Image
                  src="/icons/whatsapp.svg"
                  alt="Whatsapp"
                  width={24}
                  height={24}
                />
              </a>
              <a
                href={`mailto:${BONA_EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <MailIcon className="h-6" />
              </a>
              <a
                href={`https://instagram.com/${BONA_INSTAGRAM}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <Image
                  src="/icons/instagram.svg"
                  alt="Instagram"
                  width={24}
                  height={24}
                />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-4 ">
            <a
              href="https://bona-banana.com"
              className="text-sm hover:underline"
            >
              {t("aboutUs")}
            </a>
            <a href="/contact-us" className="text-sm hover:underline">
              {t("contactUs")}
            </a>
            <a href="/privacy-policy" className="text-sm hover:underline">
              {t("privacyPolicy")}
            </a>
          </div>

          {/* Payments methods */}

          <div
            dir="ltr"
            className="flex flex-row justify-center items-center space-x-3 "
          >
            <Image
              src="/icons/payments/visa.svg"
              alt="Visa"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
            <Image
              src="/icons/payments/mastercard.svg"
              alt="Mastercard"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
            <Image
              src="/icons/payments/apple-pay.svg"
              alt="Apple Pay"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
            <Image
              src="/icons/payments/google-pay.svg"
              alt="Google Pay"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
            <Image
              src="/icons/payments/mada.svg"
              alt="Mada"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
            <Image
              src="/icons/payments/stc.svg"
              alt="Stc pay"
              className="w-10 h-auto rounded-md"
              width={0}
              height={0}
            />
          </div>

          <div dir="ltr" className=" text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Bona Banana. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
