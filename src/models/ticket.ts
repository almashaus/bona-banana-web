export enum TicketStatus {
  VALID = "Valid",
  USED = "Used",
  CANCELLED = "Cancelled",
}

export interface Ticket {
  id: string; //
  orderId: string; // foreign key to Order
  userId: string; // foreign key to User
  eventId: string; // foreign key to event
  eventDateId: string;
  qrCode: string;
  status: TicketStatus;
  purchasePrice: number;
}
