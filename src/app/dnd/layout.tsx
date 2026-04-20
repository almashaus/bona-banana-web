import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DnD Campaigns",
  description:
    "Create and join Dungeons & Dragons campaigns. Book your sessions and embark on epic adventures.",
};

export default function DnDLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
