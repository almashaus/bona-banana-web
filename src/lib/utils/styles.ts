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

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "Admin":
      return "bg-red-100 text-red-800";
    case "Organizer":
      return "bg-blue-100 text-blue-800";
    case "Finance":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800";
    case "Suspended":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
