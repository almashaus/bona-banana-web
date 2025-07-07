import { db } from "@/src/lib/firebase/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { OrderResponse } from "@/src/models/order";

export async function GET() {
  try {
    const eventsQuery = query(
      collection(db, "orders"),
      orderBy("orderDate", "desc")
    );
    const ordersSnapshot = await getDocs(eventsQuery);

    const orders = await Promise.all(
      ordersSnapshot.docs.map(async (docData) => {
        const orderData = docData.data();
        const orderId = docData.id;

        const ticketsQuery = query(
          collection(db, "tickets"),
          where("orderId", "==", orderId)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketData = ticketsSnapshot.docs.map((doc) => doc.data());

        const userRef = doc(db, "users", ticketData[0].userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        const eventRef = doc(db, "events", orderData.eventId);
        const eventDoc = await getDoc(eventRef);
        const eventData = eventDoc.exists() ? eventDoc.data() : {};

        return {
          orderNumber: orderData.id || orderId,
          customerName: userData?.name || "Unknown",
          contact: {
            email: userData?.email || "-",
            phone: userData?.phoneNumber || "-",
          },
          eventName: eventData?.title || "Unknown Event",
          tickets: ticketData,
          status: orderData.status,
          paymentMethod: orderData.paymentMethod,
          total: orderData.totalAmount,
          orderDate: (orderData.orderDate as Timestamp).toDate(),
        } as OrderResponse;
      })
    );
    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
