import { Timestamp } from "firebase/firestore";
import { Ticket } from "./ticket";

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
  orderDate: Timestamp;
  status: OrderStatus;
  totalAmount: number;
  promoCodeId: string | null; // foreign key to PromoCode, nullable
  discountAmount: number;
  paymentMethod: string;

  // Relations
  tickets?: string[];
}

export interface OrderResponse {
  orderNumber: string;
  customerName: string;
  contact: {
    email: string;
    phone: string;
  };
  eventName: string;
  tickets: Ticket[];
  status: string;
  paymentMethod: string;
  total: number;
  orderDate: Date;
}
