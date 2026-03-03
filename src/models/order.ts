import { Ticket } from "./ticket";
import { Event } from "./event";

export enum OrderStatus {
  PENDING = "Pending",
  PAID = "Paid",
  CANCELED = "Canceled",
  REFUNDED = "Refunded",
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  invoiceId?: string | null;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  couponId: string | null;
  discountAmount: number;
  discountType: string | null;
  paymentMethod: string;
  tickets: string[];
}

export interface OrderResponse {
  orderNumber: string;
  customerName: string;
  contact: {
    email: string;
    phone: string;
  };
  event: Event;
  tickets: Ticket[];
  status: string;
  paymentMethod: string;
  total: number;
  orderDate: Date;
}
