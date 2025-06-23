import { MemberRole } from "@/src/models/user";

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case MemberRole.ADMIN:
      return "bg-red-100 text-red-700";
    case MemberRole.ORGANIZER:
      return "bg-blue-100 text-blue-700";
    case MemberRole.ANALYST:
      return "bg-cyan-100 text-cyan-700";
    case MemberRole.SUPPORT:
      return "bg-gray-100 text-gray-700";
    case MemberRole.PARTNER:
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
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
