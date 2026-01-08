import {
  MemberRole,
  PermissionAction,
  RolePermissions,
  Feature,
} from "@/src/types/permissions";

export function canAccessFromPermissions(
  rolePermissions: RolePermissions | null,
  role: MemberRole | undefined,
  feature: Feature,
  action: PermissionAction
): boolean {
  if (!rolePermissions || !role) return false;

  const permissions = rolePermissions[role];
  if (!permissions) return false;

  const featurePerm = permissions.find((p) => p.feature === feature);
  if (!featurePerm) return false;

  return !!featurePerm[action];
}
