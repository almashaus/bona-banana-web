enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  EDITOR = "editor",
  VIEWER = "viewer",
  SUPPORT = "support",
  ANALYST = "analyst",
  PARTNER = "partner",
}

interface User {
  user_id: string;
  email: string;
  name: string;
  phone_number: string;
  profile_image: string;
  role: UserRole;
}

export { UserRole };
export type { User };
