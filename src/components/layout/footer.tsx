"use client";

import { usePathname } from "next/navigation";
import { MailIcon } from "lucide-react";
import { useLanguage } from "../i18n/language-provider";

export default function Footer() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const { t } = useLanguage();

  return (
    <div>
      {!isAdminRoute && (
        <footer className="bg-greenColor text-white py-6">
          <div className="container flex flex-col items-center justify-between gap-6 ">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <img src="/logo.svg" alt="Bona Banana Logo" className="h-20" />
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/966506668581"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <img src="/icons/whatsapp.svg" alt="Whatsapp" className="h-6" />
              </a>
              <a
                href="mailto:info@bona-banana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <MailIcon className="h-6" />
              </a>
              <a
                href="https://instagram.com/gamewithbb"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75"
              >
                <img
                  src="/icons/instagram.svg"
                  alt="Instagram"
                  className="h-6"
                />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-4 mt-6">
            <a
              href="https://bona-banana.com"
              className="text-sm hover:underline"
            >
              {t("footer.aboutUs")}
            </a>
            <a href="/contact-us" className="text-sm hover:underline">
              {t("footer.contactUs")}
            </a>
            <a href="/privacy-policy" className="text-sm hover:underline">
              {t("footer.privacyPolicy")}
            </a>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Bona Banana. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
