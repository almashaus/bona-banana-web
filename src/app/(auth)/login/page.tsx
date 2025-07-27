"use client";

import type React from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLanguage } from "@/src/components/i18n/language-provider";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "✅ " + t("auth.loginSuccess"),
        description: t("auth.loginSuccessDesc"),
        variant: "success",
      });
      router.push(redirectUrl);
    } catch (error) {
      toast({
        title: t("auth.loginFailed"),
        description: t("auth.loginFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "✅ " + t("auth.loginSuccess"),
        description: t("auth.loginGoogleSuccessDesc"),
        variant: "success",
      });
      router.push(redirectUrl);
    } catch (error) {
      toast({
        title: t("auth.googleSignInFailed"),
        description: t("auth.googleSignInFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex lg:h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto my-10 flex w-full flex-col justify-center space-y-6 sm:w-[350px] rounded-lg border p-6 shadow-sm bg-white">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.welcomeBack")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.enterEmailPassword")}
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
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-right">
                  <Link
                    href="/reset-password"
                    className="text-xs font-light text-redColor underline-offset-4 hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <img src="/icons/google.svg" alt="Google Logo" className="h-5" />
              {t("auth.google")}
            </Button>
          </div>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <span>{t("auth.noAccount") + " "}</span>
          <Link
            href="/signup"
            className="underline underline-offset-4 text-orangeColor hover:text-black"
          >
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
