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
import { useTranslations } from "next-intl";
import { FormState, LoginFormSchema } from "@/src/lib/auth/validation";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState<FormState>();

  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";
  const t = useTranslations("Auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    const validatedFields = LoginFormSchema.safeParse({
      email: email,
      password: password,
    });

    if (!validatedFields.success) {
      setValidation({
        errors: validatedFields.error.flatten().fieldErrors,
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t("loginSuccess"),
        description: t("loginSuccessDesc"),
        variant: "success",
      });
      router.replace(redirectUrl);
    } catch (error: any) {
      if (error.message === "too-many-requests") {
        toast({
          title: t("loginFailed"),
          description: t("manyRequests"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("loginFailed"),
          description: t("loginFailedDesc"),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: t("loginSuccess"),
        description: t("loginGoogleSuccessDesc"),
        variant: "success",
      });
      router.replace(redirectUrl);
    } catch (error) {
      toast({
        title: t("googleSignInFailed"),
        description: t("googleSignInFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex w-screen flex-col items-center justify-center">
      <div className="mx-auto my-10 flex w-full flex-col justify-center space-y-6 sm:w-[350px] rounded-lg border p-6 shadow-sm bg-white">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcomeBack")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("enterEmailPassword")}
          </p>
        </div>
        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {validation?.errors?.email && (
                  <p className="text-xs text-red-500">
                    {validation.errors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("password")}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {validation?.errors?.password && (
                  <p className="text-xs text-red-400">
                    {validation.errors.password.map((error) => (
                      <div key={error}>- {error}</div>
                    ))}
                  </p>
                )}
                <div className="text-right">
                  <Link
                    href="/reset-password"
                    className="text-xs text-redColor underline-offset-4 hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("signingIn") : t("signIn")}
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("orContinueWith")}
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
              Google
            </Button>
          </div>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <span>{t("noAccount") + " "}</span>
          <Link
            href="/signup"
            className="underline underline-offset-4 text-orangeColor hover:text-black"
          >
            {t("signUp")}
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
