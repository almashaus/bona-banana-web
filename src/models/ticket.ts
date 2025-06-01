export enum TicketStatus {
  VALID = "valid",
  USED = "used",
  CANCELLED = "cancelled",
}

export interface Ticket {
  id: string; //
  orderId: string; // foreign key to Order
  userId: string; // foreign key to User
  eventDateId: string; // foreign key to EventDate
  qrCode: string;
  status: TicketStatus;
  purchasePrice: number;
}
