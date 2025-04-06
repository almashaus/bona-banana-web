import {
  UserRole,
  EventStatus,
  OrderStatus,
  TicketStatus,
  PromoCodeStatus,
  User,
  Event,
  EventDate,
  PromoCode,
  Order,
  Ticket,
} from "./models";

// Sample User objects
const user1: User = {
  user_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  email: "john.doe@example.com",
  name: "John Doe",
  phone_number: "+1-555-123-4567",
  profile_image: "https://example.com/profiles/johndoe.jpg",
  role: UserRole.USER,
};

const user2: User = {
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  email: "jane.smith@example.com",
  name: "Jane Smith",
  phone_number: "+1-555-987-6543",
  profile_image: "https://example.com/profiles/janesmith.jpg",
  role: UserRole.ADMIN,
};

// Sample Event object
const event1: Event = {
  event_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  creator_id: user2.user_id,
  title: "Annual Tech Conference 2025",
  slug: "annual-tech-conference-2025",
  description:
    "Join us for the biggest tech event of the year featuring workshops, keynotes, and networking opportunities.",
  event_image: "https://example.com/events/tech-conf-2025.jpg",
  ad_image: "https://example.com/ads/tech-conf-2025-banner.jpg",
  price: 199.99,
  status: EventStatus.PUBLISHED,
  location: "Riyadh",
  is_dnd: false,
  created_at: new Date("2025-01-15T10:30:00Z"),
  updated_at: new Date("2025-02-01T14:45:00Z"),
  creator: user2,
};

// Sample EventDate objects
const eventDate1: EventDate = {
  event_date_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  event_id: event1.event_id,
  start_datetime: new Date("2025-05-15T09:00:00Z"),
  end_datetime: new Date("2025-05-15T18:00:00Z"),
  capacity: 500,
  event: event1,
};

const eventDate2: EventDate = {
  event_date_id: "6c9e6679-7425-40de-944b-e07fc1f90ae8",
  event_id: event1.event_id,
  start_datetime: new Date("2025-05-16T09:00:00Z"),
  end_datetime: new Date("2025-05-16T18:00:00Z"),
  capacity: 500,
  event: event1,
};

// Update event with dates
event1.dates = [eventDate1, eventDate2];

// Sample PromoCode object
const promoCode1: PromoCode = {
  code_id: "TECHCONF25",
  discount: 25.0,
  status: PromoCodeStatus.VALID,
  expiration_date: new Date("2025-04-30T23:59:59Z"),
};

// Sample Order object
const order1: Order = {
  order_id: "d85f1d45-6356-458f-9238-8f9c2ca1d5bc",
  user_id: user1.user_id,
  order_date: new Date("2025-03-08T15:32:10Z"),
  status: OrderStatus.PAID,
  total_amount: 174.99,
  promo_code_id: promoCode1.code_id,
  discount_amount: 25.0,
  user: user1,
  promo_code: promoCode1,
};

// Sample Ticket objects
const ticket1: Ticket = {
  ticket_id: "e2a631b9-9e40-4ff0-868b-d3a2c5f67d9c",
  order_id: order1.order_id,
  user_id: user1.user_id,
  event_date_id: eventDate1.event_date_id,
  qr_code: "https://example.com/qrcodes/e2a631b9.png",
  status: TicketStatus.VALID,
  purchase_price: 174.99,
  order: order1,
  user: user1,
  event_date: eventDate1,
};

const ticket2: Ticket = {
  ticket_id: "f3b742a0-0f56-4a12-979e-b4d7d8d9e0f1",
  order_id: order1.order_id,
  user_id: user1.user_id,
  event_date_id: eventDate2.event_date_id,
  qr_code: "https://example.com/qrcodes/f3b742a0.png",
  status: TicketStatus.VALID,
  purchase_price: 0.0, // Second day is included for free
  order: order1,
  user: user1,
  event_date: eventDate2,
};

// Update order with tickets
order1.tickets = [ticket1, ticket2];

// Update eventDates with tickets
eventDate1.tickets = [ticket1];
eventDate2.tickets = [ticket2];

// Update promoCode with orders
promoCode1.orders = [order1];

// Export all sample data
export const sampleData = {
  users: [user1, user2],
  events: [event1],
  eventDates: [eventDate1, eventDate2],
  promoCodes: [promoCode1],
  orders: [order1],
  tickets: [ticket1, ticket2],
};
