import { UserRole } from "@/src/models/user";

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return "text-red-500";
    case UserRole.SUPER_ADMIN:
      return "text-rose-500";
    case UserRole.EDITOR:
      return "text-green-500";
    case UserRole.VIEWER:
      return "text-yellow-500";
    case UserRole.SUPPORT:
      return "text-lime-500";
    case UserRole.ANALYST:
      return "text-purple-500";
    case UserRole.PARTNER:
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
};
