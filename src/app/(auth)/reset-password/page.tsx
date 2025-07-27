"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLanguage } from "@/src/components/i18n/language-provider";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);

      setIsEmailSent(true);
      toast({
        title: t("auth.resetEmailSent"),
        description: t("auth.checkEmailForReset"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("auth.error"),
        description: t("auth.resetEmailFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="container flex lg:h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto my-10 flex w-full flex-col justify-center space-y-6 sm:w-[350px] rounded-lg border p-6 shadow-sm bg-white">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <Mail className="h-6 w-6" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.checkYourEmail")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.sentPasswordResetLink")} <strong>{email}</strong>
            </p>
          </div>
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.didntReceiveEmail")}
            </p>

            <Button asChild>
              <Link href="/login">{t("auth.backToLogin")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex lg:h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto my-10 flex w-full flex-col justify-center space-y-6 sm:w-[350px] rounded-lg border p-6 shadow-sm bg-white">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.resetYourPassword")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.enterEmailToReset")}
          </p>
        </div>
        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  placeholder={t("auth.emailPlaceholder")}
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("auth.sending") : t("auth.sendResetLink")}
              </Button>
            </div>
          </form>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-greenColor"
          >
            ← {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
