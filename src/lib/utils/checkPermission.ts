import {
  MemberRole,
  PermissionAction,
  RolePermissions,
} from "@/src/types/permissions";

export function canAccessFromPermissions(
  rolePermissions: RolePermissions | null,
  role: MemberRole | undefined,
  feature: string,
  action: PermissionAction,
): boolean {
  if (!rolePermissions || !role) return false;

  // Admin has full access to all features
  if (role === MemberRole.ADMIN) return true;

  const permissions = rolePermissions[role];
  if (!permissions) return false;

  const featurePerm = permissions.find((p) => p.feature === feature);
  if (!featurePerm) return false;

  return !!featurePerm[action];
}
