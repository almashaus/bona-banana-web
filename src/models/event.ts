import { Order } from "./order";
import { Ticket } from "./ticket";
import { AppUser } from "./user";

// Enum types

export enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELED = "canceld",
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
  updatedBy?: string;
  title: string;
  titleAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  eventImage: string;
  adImage: string;
  price: number;
  status: EventStatus;
  city: City;
  venue: string;
  locationUrl: string;
  createdAt: Date;
  updatedAt: Date;

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
  availableTickets: number;

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

export interface DashboardEvent extends Event {
  eventDate: EventDate;
  tickets: (Ticket & { user: AppUser })[];
}

export type City = {
  ar: string;
  en: string;
};
