import { Timestamp } from "firebase/firestore";
import { User } from "./user";
import { Order } from "./order";
import { Ticket } from "./ticket";

// Enum types

enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

enum PromoCodeStatus {
  VALID = "valid",
  UNVALID = "unvalid",
}

// Base interfaces

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
  created_at: Timestamp;
  updated_at: Timestamp;

  // Relations
  dates: EventDate[];
}

interface EventDate {
  event_date_id: string; //
  event_id: string; // , foreign key to Event
  date: Date;
  start_time: Date;
  end_time: Date;
  capacity: number;

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

// Export all models
export { EventStatus, PromoCodeStatus };
export type { Event, EventDate, PromoCode };
