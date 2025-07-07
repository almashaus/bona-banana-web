import { OrderStatus } from "@/src/models/order";
import { TicketStatus } from "@/src/models/ticket";
import { MemberRole, MemberStatus } from "@/src/models/user";

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
    case MemberStatus.ACTIVE:
      return "bg-green-100 text-green-800";
    case MemberStatus.SUSPENDED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getOrderStatusBadgeColor = (status: string) => {
  switch (status) {
    case OrderStatus.PAID:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case OrderStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case OrderStatus.REFUNDED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export const getTicketStatusBadgeColor = (status: string) => {
  switch (status) {
    case TicketStatus.VALID:
      return "bg-green-100 text-green-800";
    case TicketStatus.USED:
      return "bg-blue-100 text-blue-800";
    case TicketStatus.CANCELLED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
