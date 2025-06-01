import { Timestamp } from "firebase/firestore";
import { Order } from "./order";
import { Ticket } from "./ticket";

// Enum types

export enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum PromoCodeStatus {
  VALID = "valid",
  UNVALID = "unvalid",
}

// Base interfaces

export interface Event {
  id: string;
  creatorId: string; // foreign key to User
  title: string;
  slug: string;
  description: string;
  eventImage: string;
  adImage: string;
  price: number;
  status: EventStatus;
  location: string;
  isDnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Relations
  dates: EventDate[];
}

export interface EventDate {
  id: string;
  eventId: string; // foreign key to Event
  date: Date;
  startTime: Date;
  endTime: Date;
  capacity: number;

  // Relations
  tickets?: Ticket[];
}

export interface PromoCode {
  id: string;
  discount: number;
  status: PromoCodeStatus;
  expirationDate: Date;

  // Relations
  orders?: Order[];
}
