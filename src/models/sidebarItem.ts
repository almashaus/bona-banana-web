import {
  CalendarRange,
  LayoutDashboard,
  LucideIcon,
  ShieldCheck,
  Ticket,
  UserRound,
  UserRoundCog,
  UsersRound,
  Percent,
  ChartColumn,
  FileText,
  Settings,
} from "lucide-react";

export type Item = {
  title: string;
  url: string;
  icon: LucideIcon;
  notifications?: number;
};

export const sidebarData: Item[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Events",
    url: "/admin/events",
    icon: CalendarRange,
  },
  {
    title: "Reservations",
    url: "/admin/reservations",
    icon: Ticket,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: UsersRound,
  },
  {
    title: "Team Members",
    url: "/admin/members",
    icon: UserRoundCog,
  },
  {
    title: "Coupons",
    url: "...",
    icon: Percent,
  },
  {
    title: "Analytics",
    url: "...",
    icon: ChartColumn,
  },
  {
    title: "Reports",
    url: "...",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "...",
    icon: Settings,
  },
  {
    title: "Profile",
    url: "/admin/profile",
    icon: UserRound,
  },
];
