"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Button as EmailButton } from "@react-email/components";
import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const BONA_PHONE = process.env.NEXT_PUBLIC_BONA_PHONE;
const BONA_EMAIL = process.env.NEXT_PUBLIC_BONA_EMAIL;
const BONA_INSTAGRAM = process.env.NEXT_PUBLIC_BONA_INSTAGRAM;

export default function contactUsPage() {
  const t = useTranslations("Contact");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-12 md:py-24">
      <div className="container flex flex-col justify-center">
        <div className="space-y-2 mb-6 text-center flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight ">
            {t("contactUs")}
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col md:flex-row  space-y-6 md:space-y-0 justify-center">
          <Card className="px-2 py-4 me-4 w-full md:w-1/3 lg:w-1/4">
            <CardHeader className="text-center">
              <CardTitle>{t("sendMessage")}</CardTitle>
            </CardHeader>
            <CardContent className="">
              <Label>{t("email")}</Label>
              <Input
                className="mt-2 mb-4 w-full"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Label>{t("subject")}</Label>
              <Input
                className="mt-2 mb-4 w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Label>{t("content")}</Label>
              <Textarea
                rows={5}
                className="mt-2 mb-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-center">
                <EmailButton
                  href={`mailto:{BONA_EMAIL}?subject=${encodeURIComponent(
                    subject,
                  )}&body=${encodeURIComponent(content)}`}
                  className="px-4 py-2 rounded-lg bg-orangeColor text-white"
                >
                  {t("send")}
                </EmailButton>
              </div>
            </CardContent>
          </Card>

          <Card className="px-2 py-4 w-full md:w-1/3 lg:w-1/4">
            <CardHeader className="text-center">
              <CardTitle>{t("getTouch")}</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex flex-col items-center align-middle text-center">
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href={`https://wa.me/${BONA_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <img
                        src="/icons/socials/whatsapp.svg"
                        alt="Whatsapp"
                        className="h-6"
                      />
                    </div>
                  </a>
                  <p>{BONA_PHONE}</p>
                </div>
              </div>
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href={`mailto:{BONA_EMAIL}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <MailIcon className="text-white" />
                    </div>
                  </a>
                  <p>{BONA_EMAIL}</p>
                </div>
              </div>
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href={`https://instagram.com/{BONA_INSTAGRAM}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <img
                        src="/icons/socials/instagram.svg"
                        alt="Instagram"
                        className="h-6"
                      />
                    </div>
                  </a>
                  <p dir="ltr">@{BONA_INSTAGRAM}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
