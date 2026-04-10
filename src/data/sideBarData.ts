import {
  CalendarRange,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Swords,
  Ticket,
  UserRound,
  UserRoundCog,
  UsersRound,
  Percent,
  FileText,
  Settings,
} from "lucide-react";
import { SidebarItem } from "../types/sidebarItem";
import { MemberRole } from "../types/permissions";

export const sidebarData: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    requires: { feature: "Dashboard", action: "view" },
  },
  {
    title: "Events",
    url: "/admin/events",
    icon: CalendarRange,
    requires: { feature: "Event Management", action: "view" },
  },
  {
    title: "Reservations",
    url: "/admin/reservations",
    icon: Ticket,
    requires: { feature: "Reservations", action: "view" },
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
    requires: { feature: "Products", action: "view" },
  },
  {
    title: "DnD Management",
    url: "/admin/dnd",
    icon: Swords,
    requires: { feature: "DnD Management", action: "view" },
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: UsersRound,
    requires: { feature: "User Management", action: "view" },
  },
  {
    title: "Team Members",
    url: "/admin/members",
    icon: UserRoundCog,
    requires: { feature: "User Management", action: "view" },
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: Percent,
    requires: { feature: "Coupons", action: "view" },
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: FileText,
    requires: { feature: "Reports", action: "view" },
  },
  {
    title: "Permissions",
    url: "/admin/permissions",
    icon: ShieldCheck,
    requires: { role: MemberRole.ADMIN },
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    requires: { feature: "Settings", action: "view" },
  },
  {
    title: "Profile",
    url: "/admin/profile",
    icon: UserRound,
    requires: { feature: "Profile", action: "view" },
    hideWhenSuspended: false,
  },
];
