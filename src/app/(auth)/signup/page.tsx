"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLanguage } from "@/src/components/i18n/language-provider";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.passwordsDoNotMatch"),
        description: t("auth.passwordsDoNotMatchDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast({
        title: "✅ " + t("auth.registrationSuccess"),
        description: t("auth.registrationSuccessDesc"),
        variant: "success",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: t("auth.registrationFailed"),
        description: t("auth.registrationFailedDesc"),
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
      router.push("/");
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
            {t("auth.createAccount")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.enterInfoToCreateAccount")}
          </p>
        </div>
        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("auth.namePlaceholder")}
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  {t("auth.confirmPassword")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("auth.creatingAccount")
                  : t("auth.createAccount")}
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
          <span>{t("auth.alreadyHaveAccount") + " "}</span>
          <Link
            href="/login"
            className="underline underline-offset-4 text-orangeColor hover:text-black"
          >
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
