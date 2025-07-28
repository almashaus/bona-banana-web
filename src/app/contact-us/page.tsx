"use client";
import { useLanguage } from "@/src/components/i18n/language-provider";
import { Button } from "@/src/components/ui/button";
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
import { InstagramIcon, MailIcon, PhoneIcon } from "lucide-react";
import { useState } from "react";

export default function contactUsPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-12 md:py-24">
      <div className="container flex flex-col justify-center">
        <div className="space-y-2 mb-6 text-center flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight ">
            {t("contact.contactUs")}
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {t("contact.description")}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 justify-center">
          <Card className="px-2 py-4 w-full md:w-1/4">
            <CardHeader className="text-center">
              <CardTitle>{t("contact.sendMessage")}</CardTitle>
            </CardHeader>
            <CardContent className="">
              <Label>Email</Label>
              <Input
                className="mt-2 mb-4 w-full"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Label>Subject</Label>
              <Input
                className="mt-2 mb-4 w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Label>Content</Label>
              <Textarea
                rows={5}
                className="mt-2 mb-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-center">
                <EmailButton
                  href={`mailto:info@bona-banana.com?subject=${encodeURIComponent(
                    subject
                  )}&body=${encodeURIComponent(content)}`}
                  className="px-4 py-2 rounded-lg bg-orangeColor text-white"
                >
                  Send Email
                </EmailButton>
              </div>
            </CardContent>
          </Card>

          <Card className="px-2 py-4 w-full md:w-1/4">
            <CardHeader className="text-center">
              <CardTitle>{t("contact.getTouch")}</CardTitle>
            </CardHeader>
            <CardContent className="py-6 flex flex-col items-center align-middle text-center">
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href="https://wa.me/966506668581"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <img
                        src="/icons/whatsapp.svg"
                        alt="Whatsapp"
                        className="h-6"
                      />
                    </div>
                  </a>
                  <p>966 50 666 8581</p>
                </div>
              </div>
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href="mailto:info@bona-banana.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <MailIcon className="text-white" />
                    </div>
                  </a>
                  <p>info@bona-banana.com</p>
                </div>
              </div>
              <div className="mb-10">
                <div className="flex flex-col items-center">
                  <a
                    href="https://instagram.com/gamewithbb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <div className="rounded-full bg-orangeColor p-2">
                      <img
                        src="/icons/instagram.svg"
                        alt="Instagram"
                        className="h-6"
                      />
                    </div>
                  </a>
                  <p>@gamewithbb</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
