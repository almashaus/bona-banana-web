import type { LucideIcon } from "lucide-react";
import type {
  Feature,
  PermissionAction,
  MemberRole,
  MemberStatus,
} from "@/src/types/permissions";

export type SidebarRequirement =
  | {
      feature: Feature;
      action: PermissionAction;
    }
  | {
      role: MemberRole;
    }
  | ((ctx: {
      role?: MemberRole;
      status?: MemberStatus;
      can: (feature: Feature, action: PermissionAction) => boolean;
    }) => boolean);

export type SidebarItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  requires?: SidebarRequirement;
  hideWhenSuspended?: boolean;
};
