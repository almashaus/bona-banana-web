export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
  SUPPORT = "support",
  ANALYST = "analyst",
  PARTNER = "partner",
}

export enum Status {
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
}

export interface DashboardUser {
  id: string;
  role: UserRole;
  status: Status;
  lastLogin: Date;
  eventsManaged: number;
}
