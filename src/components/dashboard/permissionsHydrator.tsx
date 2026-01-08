"use client";

import { useEffect } from "react";
import { RolePermissions } from "@/src/types/permissions";
import { usePermissionStore } from "@/src/lib/stores/usePermissionStore";

export function PermissionsHydrator({
  initialRolePermissions,
  children,
}: {
  initialRolePermissions: RolePermissions;
  children: React.ReactNode;
}) {
  const setRolePermissions = usePermissionStore((s) => s.setRolePermissions);

  useEffect(() => {
    setRolePermissions(initialRolePermissions);
  }, [initialRolePermissions, setRolePermissions]);

  return <>{children}</>;
}
