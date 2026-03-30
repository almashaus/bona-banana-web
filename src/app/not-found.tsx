import Link from "next/link";
import { Button } from "../components/ui/button";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function GlobalNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex flex-col justify-center items-center gap-4 min-h-screen min-w-full">
      <Image
        src="/images/404-not-found.png"
        alt="404 Not Found"
        width={300}
        height={300}
      />
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <div className="text-center text-muted-foreground">
        <p>{t("description")}</p>
      </div>
      <Button asChild>
        <Link href="/">{t("homePage")}</Link>
      </Button>
    </div>
  );
}
