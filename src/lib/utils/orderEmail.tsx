import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type * as React from "react";
import { Order } from "@/src/models/order";
import { Event } from "@/src/models/event";
import { Ticket } from "@/src/models/ticket";

const baseUrl = process.env.BASE_URL ? `https://${process.env.BASE_URL}` : "";

export function OrderConfirmationEmail(
  order?: Order,
  tickets?: Ticket[],
  event?: Event
) {
  if (!order || !tickets || !event) return null;

  const quantity = order.tickets?.length || 1;
  const total = (event.price || 0) * quantity;
  const subtotal = total - total * 0.15;
  const fees = (total - subtotal).toFixed(2);

  const eventDateObj = event.dates?.find(
    (d) => d.id === tickets[0].eventDateId
  );

  const eventDate = new Date(eventDateObj!.date);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={logoDiv}>
              {/* CheckCircle SVG */}
              <Img src="/public/logo.svg" width={80} height={80} alt="Logo" />
            </div>
            <Heading
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: "16px 0 8px 0",
                textAlign: "center",
                color: "#222",
              }}
            >
              Thank you for your purchase!
            </Heading>
            <Text style={mutedText}>
              Your order has been confirmed. Please find your ticket details
              below.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={{ padding: "24px" }}>
            <Row>
              <Column>
                <Text style={eventTitle}>{event.title}</Text>
                <Text style={eventDetail}>
                  <span style={{ fontWeight: 600 }}>Date:</span>{" "}
                  {formatDate(eventDate)}
                </Text>
                <Text style={eventDetail}>
                  <span style={{ fontWeight: 600 }}>Location:</span>{" "}
                  {event.location}
                </Text>
              </Column>
              <Column align="right">
                <Text style={mutedTextSm}>Order Number</Text>
                <Text style={orderNumber}>{order.id}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section style={{ padding: "24px" }}>
            <Text style={{ fontWeight: 700, fontSize: 20 }}>Tickets</Text>
            {tickets.map((ticket) => (
              <Row key={ticket.id} style={{ marginBottom: 24 }}>
                <Column>
                  <Text style={ticketId}>
                    Ticket ID:{" "}
                    <span style={{ ...ticketId, fontWeight: 500 }}>
                      {" "}
                      {ticket.id}{" "}
                    </span>
                  </Text>
                </Column>
                <Column align="right">
                  {/* Placeholder QR code */}
                  <Img
                    src={`${baseUrl}/api/qr?data=${ticket.id}`}
                    alt="QR Code"
                    width="200"
                    height="200"
                  />
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={{ padding: "24px" }}>
            <Row>
              <Column>
                <Text style={mutedTextSm}>Tickets</Text>
              </Column>
              <Column align="right">
                <Text style={{ fontSize: 20 }}>
                  {quantity} × {event.price}
                  <span> SR </span>
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={mutedTextSm}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={{ fontSize: 20 }}>
                  {subtotal}
                  <span> SR </span>
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={mutedTextSm}>Tax & Fees</Text>
              </Column>
              <Column align="right">
                <Text style={{ fontSize: 20 }}>
                  {fees}
                  <span> SR </span>
                </Text>
              </Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column>
                <Text style={{ fontWeight: 700, fontSize: 20 }}>
                  Total{" "}
                  <span style={{ fontWeight: 300, fontSize: 12 }}>
                    *VAT included
                  </span>
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ fontWeight: 700, fontSize: 20 }}>
                  {total}
                  <span> SR </span>
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Section style={{ textAlign: "center", padding: "24px" }}>
            <Text style={mutedText}>
              You can view your tickets anytime in your account. If you have any
              questions, please contact us.
            </Text>
            <Text style={{ ...mutedText, marginTop: 16, fontSize: 12 }}>
              &copy; 2025 BonaBanana. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "24px auto",
  width: "600px",
  maxWidth: "100%",
  border: "1px solid #E5E5E5",
  borderRadius: "12px",
  background: "#fff",
};

const logoDiv = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 80,
  height: 80,
  borderRadius: "9999px",
  background: "#dcfce7",
  color: "#16a34a",
  marginBottom: 16,
};

const eventTitle = {
  fontSize: "24px",
  fontWeight: 600,
  marginBottom: 4,
};

const eventDetail = {
  fontSize: "20px",
  color: "#444",
  marginBottom: 2,
};

const orderNumber = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#222",
  marginTop: 4,
};

const ticketId = {
  fontSize: "20px",
  color: "#666",
  marginBottom: 2,
};

const hr = {
  borderColor: "#E5E5E5",
  margin: "0",
};

const mutedText = {
  color: "#888",
  fontSize: "20px",
  lineHeight: "1.6",
};

const mutedTextSm = {
  color: "#888",
  fontSize: "20px",
};

export default OrderConfirmationEmail;
