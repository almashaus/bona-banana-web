import { Timestamp } from "firebase/firestore";

export enum MemberRole {
  ADMIN = "Admin",
  ORGANIZER = "Organizer",
  SUPPORT = "Support",
  ANALYST = "Analyst",
  PARTNER = "Partner",
}

export enum MemberStatus {
  ACTIVE = "Active",
  SUSPENDED = "Suspended",
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  profileImage: string;
  birthDate: string;
  gender: string;
  hasDashboardAccess: boolean;
  dashboard?: DashboardUser;
}

export interface DashboardUser {
  role: MemberRole;
  status: MemberStatus;
  joinedDate?: Timestamp | undefined;
  eventsManaged: number;
}
