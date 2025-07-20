import { Ticket } from "./ticket";
import { Event } from "./event";

export enum OrderStatus {
  PENDING = "Pending",
  PAID = "Paid",
  CANCELLED = "Cancelled",
  REFUNDED = "Refunded",
}

export interface Order {
  id: string; //
  userId: string; // foreign key to User
  eventId: string; // foreign key to event
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  promoCodeId: string | null; // foreign key to PromoCode, nullable
  discountAmount: number;
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
