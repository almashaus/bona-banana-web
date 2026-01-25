"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Menu, MonitorCog, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { LanguageToggle } from "@/src/components/i18n/language-toggle";
import { UserNav } from "@/src/components/auth/user-nav";
import { useAuth } from "@/src/features/auth/auth-provider";
import { ModeToggle } from "@/src/components/theme/mode-toggle";
import { AppUser } from "@/src/models/user";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { useLocale, useTranslations } from "next-intl";

export default function Header({
  initialUser,
}: {
  initialUser?: AppUser | null;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const { user, initialLoading } = useAuth();
  const t = useTranslations("Nav");
  const locale = useLocale();

  return (
    <header
      dir={locale === "en" || pathname.startsWith("/admin") ? "ltr" : "rtl"}
      className={`fixed top-0 z-50 w-full bg-white/95 backdrop-blur ${pathname.startsWith("/admin") ? "supports-[backdrop-filter]:bg-greenColor/90" : "supports-[backdrop-filter]:bg-white/60 border-b"}`}
    >
      <div className="px-4 flex h-16 items-center justify-between">
        <div className="flex justify-start items-center">
          {pathname.startsWith("/admin") && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="flex justify-start items-center rounded-lg text-neutral-400 dark:text-white hover:bg-transparent"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="me-2 text-white" />
            </Button>
          )}
          <Link href="/" className="flex items-center">
            <img
              src="/images/bona-banana.svg"
              alt="Bona Banana Logo"
              className="h-10 me-2"
            />
            <span
              className={`hidden ${pathname.startsWith("/admin") ? "text-white" : "text-orangeColor"} font-bold sm:inline-block`}
            >
              Bona Banana
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!pathname.startsWith("/admin") && (
            <div className="flex items-center gap-2">
              {(initialLoading && initialUser?.hasDashboardAccess) ||
              user?.hasDashboardAccess ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => (window.location.href = "/admin")}
                >
                  <MonitorCog className="text-redColor" />
                </Button>
              ) : (
                <></>
              )}

              {/* <ModeToggle /> */}
              <LanguageToggle />
            </div>
          )}
          {initialLoading ? (
            initialUser ? (
              <UserNav user={initialUser} />
            ) : (
              <Button variant="outline" size="icon" className="bg-muted">
                <User className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            )
          ) : user ? (
            <UserNav user={user} />
          ) : (
            <Button asChild variant="outline" size="default">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
