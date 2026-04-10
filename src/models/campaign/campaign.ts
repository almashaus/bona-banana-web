import { OrderStatus } from "../order";
import { City } from "../event";

export enum CampaignStatus {
  PENDING = "Pending",
  PUBLISHED = "Published",
  REJECTED = "Rejected",
}

export interface Campaign {
  id: string;
  title: string;

  masterId: string;

  status: CampaignStatus;

  sessionsCount: number; // 3–7
  playersCount: number; // 3–7

  price: number;

  city: City;
  startDate: Date;

  createdAt: Date;
  updatedAt: Date;

  approvedBy?: string;
  approvedAt?: Date;
}

export interface CampaignPlayer {
  id: string;
  campaignId: string;

  name: string;
  isActive: boolean;

  assignedUserId?: string;

  createdAt: Date;
}

export interface CampaignSession {
  id: string;
  campaignId: string;

  sessionNumber: number;
  dateTime: Date;

  createdAt: Date;
}

export enum BookingStatus {
  PENDING = "Pending",
  PAID = "Paid",
  CANCELED = "Canceled",
}

export interface CampaignBooking {
  id: string; // (session id + player id suffix)
  campaignId: string;
  sessionId: string;
  playerId: string;

  userId: string;

  status: BookingStatus;

  orderId?: string; // link to campaignOrders

  createdAt: Date;
}

export interface CampaignOrder {
  id: string;

  campaignId: string;
  sessionIds: string[];

  userId: string;

  invoiceId: string;
  paymentMethod: string;

  totalAmount: number;
  discountAmount: number;

  status: OrderStatus;

  orderDate: Date;
}
