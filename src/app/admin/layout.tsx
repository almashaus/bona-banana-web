import type React from "react";
import type { Metadata } from "next";
import { DashboardSidebar } from "@/src/components/ui/dashboard-sidebar";
import { PermissionsHydrator } from "@/src/components/dashboard/permissionsHydrator";
import { getRolePermissionsServer } from "@/src/lib/firebase/getRolePermissions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rolePermissions = await getRolePermissionsServer();

  return (
    <div dir="ltr" className="flex">
      <PermissionsHydrator initialRolePermissions={rolePermissions}>
        <DashboardSidebar />
        <section className="w-full">{children}</section>
      </PermissionsHydrator>
    </div>
  );
}
