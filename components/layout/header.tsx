"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { UserNav } from "@/components/auth/user-nav";
import { useAuth } from "@/components/auth/auth-provider";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Bona Banana Logo" className="h-10" />
            <span className="hidden font-bold sm:inline-block">
              Bona Banana
            </span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {/* <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/events"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/events" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Events
            </Link> */}

            {user?.isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-redColor ${
                  pathname.startsWith("/admin")
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* <ModeToggle /> */}
          <LanguageToggle />
          {user ? (
            <UserNav user={user} />
          ) : (
            <Button asChild variant="outline" size="default">
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
