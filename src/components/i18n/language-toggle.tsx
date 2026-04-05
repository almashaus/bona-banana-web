"use client";

import { Check, Globe } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/src/i18n/set-locale";
import { useLocale } from "next-intl";

export function LanguageToggle() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem] text-black" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await setLocale("ar");
              router.refresh();
            })
          }
        >
          <span>🇸🇦 {"عربي"}</span>
          {locale === "ar" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await setLocale("en");
              router.refresh();
            })
          }
        >
          <span>🇬🇧 {"English"}</span>
          {locale === "en" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
