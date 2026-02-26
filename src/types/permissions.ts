export enum MemberRole {
  ADMIN = "Admin",
  MANAGER = "Manager",
  ORGANIZER = "Organizer",
  SUPPORT = "Support",
  FINANCE = "Finance",
  PARTNER = "Partner",
}

export enum MemberStatus {
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
}

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type FeaturePermission = {
  feature: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

// Each role has multiple features with their permissions
export type RolePermissions = {
  [key in MemberRole]: FeaturePermission[];
};
