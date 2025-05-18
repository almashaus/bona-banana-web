enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

interface User {
  user_id: string; //
  email: string;
  name: string;
  phone_number: string;
  profile_image: string;
  role: UserRole;
}

export { UserRole };
export type { User };
