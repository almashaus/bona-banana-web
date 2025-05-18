import { EventDate } from "./event";
import { Order } from "./order";
import { User } from "./user";

enum TicketStatus {
  VALID = "valid",
  USED = "used",
  CANCELLED = "cancelled",
}

interface Ticket {
  ticket_id: string; //
  order_id: string; // , foreign key to Order
  user_id: string; // , foreign key to User
  event_date_id: string; // , foreign key to EventDate
  qr_code: string;
  status: TicketStatus;
  purchase_price: number;

  // Relations
  order?: Order;
  user?: User;
  event_date?: EventDate;
}

export { TicketStatus };
export type { Ticket };
