import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { AppUser } from "@/src/models/user";
import {
  RolePermissions,
  MemberRole,
  PermissionAction,
} from "@/src/types/permissions";
import { usePermissionStore } from "@/src/lib/stores/usePermissionStore";
import { canAccessFromPermissions } from "@/src/lib/utils/checkPermission";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load permissions");
  return (await res.json()) as RolePermissions;
};

export function usePermissions(user: AppUser | null | undefined) {
  const role = user?.dashboard?.role as MemberRole | undefined;

  const rolePermissions = usePermissionStore((s) => s.rolePermissions);
  const setRolePermissions = usePermissionStore((s) => s.setRolePermissions);

  const { data, isLoading, error } = useSWR(
    role ? "/api/admin/permissions" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000, // optional
    },
  );

  useEffect(() => {
    if (data) setRolePermissions(data);
  }, [data, setRolePermissions]);

  const effectivePermissions = rolePermissions ?? data ?? null;

  const hasPermission = useMemo(() => {
    return (feature: string, action: PermissionAction) =>
      canAccessFromPermissions(effectivePermissions, role, feature, action);
  }, [effectivePermissions, role]);

  return {
    hasPermission,
  };
}
