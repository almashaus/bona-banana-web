import { CouponStatus, CouponType } from "@/src/models/coupon";
import { OrderStatus } from "@/src/models/order";
import { TicketStatus } from "@/src/models/ticket";
import { MemberRole, MemberStatus } from "@/src/types/permissions";

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case MemberRole.ADMIN:
      return "bg-red-100 text-red-700";
    case MemberRole.MANAGER:
      return "bg-amber-100 text-amber-600";
    case MemberRole.ORGANIZER:
      return "bg-blue-100 text-blue-700";
    case MemberRole.FINANCE:
      return "bg-cyan-100 text-cyan-700";
    case MemberRole.SUPPORT:
      return "bg-gray-100 text-gray-700";
    case MemberRole.PARTNER:
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case MemberRole.ADMIN:
      return "text-red-700";
    case MemberRole.MANAGER:
      return "text-amber-600";
    case MemberRole.ORGANIZER:
      return "text-blue-700";
    case MemberRole.FINANCE:
      return "text-cyan-700";
    case MemberRole.SUPPORT:
      return "text-gray-700";
    case MemberRole.PARTNER:
      return "text-purple-700";
    default:
      return "text-gray-700";
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
    case OrderStatus.CANCELED:
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
    case TicketStatus.CANCELED:
      return "bg-red-100 text-red-800";
    case TicketStatus.PENDING:
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function statusColor(s: CouponStatus) {
  switch (s) {
    case "Active":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "Scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "Expired":
      return "bg-muted text-muted-foreground";
    case "Disabled":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "Fully Redeemed":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }
}

export function typeBadgeColor(t: CouponType) {
  switch (t) {
    case "Discount":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300";
    case "Voucher":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300";
    case "Offer":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
  }
}
