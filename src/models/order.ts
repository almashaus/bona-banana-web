import exp from "constants";
import { User } from "./user";
import { PromoCode } from "./event";
import { Ticket } from "./ticket";

enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

interface Order {
  order_id: string; //
  user_id: string; // , foreign key to User
  order_date: Date;
  status: OrderStatus;
  total_amount: number;
  promo_code_id: string | null; // , foreign key to PromoCode, nullable
  discount_amount: number;

  // Relations
  user?: User;
  promo_code?: PromoCode | null;
  tickets?: Ticket[];
}

export { OrderStatus };
export type { Order };
