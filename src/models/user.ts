import { MemberRole, MemberStatus } from "../types/permissions";
import { Ticket } from "./ticket";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  birthDate?: Date | null;
  gender?: string;
  hasDashboardAccess: boolean;
  dashboard?: DashboardUser;
}

export interface DashboardUser {
  role: MemberRole;
  status: MemberStatus;
  joinedDate?: Date;
  eventsManaged: number;
  eventsAccess?: string[];
  activityLog?: ActivityLog[];
}

export interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
  type: ActivityLogType;
}

export type ActivityLogType =
  | "Event Management"
  | "Reports"
  | "Notification"
  | "User Management"
  | "Settings";

export interface CustomerResponse {
  user: AppUser;
  tickets: Ticket[];
}
