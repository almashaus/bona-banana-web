import { Timestamp } from "firebase/firestore";
import { Ticket } from "./ticket";

export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
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

  // Relations
  tickets?: Ticket[];
}
