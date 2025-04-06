// Enum types
enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

enum TicketStatus {
  VALID = "valid",
  USED = "used",
  CANCELLED = "cancelled",
}

enum PromoCodeStatus {
  VALID = "valid",
  UNVALID = "unvalid",
}

// Base interfaces
interface User {
  user_id: string; //
  email: string;
  name: string;
  phone_number: string;
  profile_image: string;
  role: UserRole;
}

interface Event {
  event_id: string;
  creator_id: string; // foreign key to User
  title: string;
  slug: string;
  description: string;
  event_image: string;
  ad_image: string;
  price: number;
  status: EventStatus;
  location: string;
  is_dnd: boolean;
  created_at: Date;
  updated_at: Date;

  // Relations
  creator?: User;
  dates?: EventDate[];
}

interface EventDate {
  event_date_id: string; //
  event_id: string; // , foreign key to Event
  start_datetime: Date;
  end_datetime: Date;
  capacity: number;

  // Relations
  event?: Event;
  tickets?: Ticket[];
}

interface PromoCode {
  code_id: string;
  discount: number;
  status: PromoCodeStatus;
  expiration_date: Date;

  // Relations
  orders?: Order[];
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

// Export all models
export { UserRole, EventStatus, OrderStatus, TicketStatus, PromoCodeStatus };
export type { User, Event, EventDate, PromoCode, Order, Ticket };
