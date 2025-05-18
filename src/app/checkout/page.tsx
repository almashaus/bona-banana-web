// "use client";

// import type React from "react";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { CalendarDays, CreditCard, MapPin, Ticket } from "lucide-react";
// import { Button } from "@/src/components/ui/button";
// import { Input } from "@/src/components/ui/input";
// import { Label } from "@/src/components/ui/label";
// import { Separator } from "@/src/components/ui/separator";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/src/components/ui/tabs";
// import { useToast } from "@/src/components/ui/use-toast";
// import { formatDate } from "@/src/utils/formatDate";
// import { generateOrderNumber } from "@/src/utils/utils";
// import { events } from "@/src/models/events";
// import { useAuth } from "@/src/features/auth/auth-provider";

// export default function CheckoutPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { toast } = useToast();
//   const { user } = useAuth();

//   const eventId = searchParams.get("eventId");
//   const date = searchParams.get("date");
//   const quantity = Number.parseInt(searchParams.get("quantity") || "1");

//   const event = events.find((e) => e.id === eventId);

//   const [isProcessing, setIsProcessing] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState("card");

//   if (!event || !date) {
//     return (
//       <div className="container py-10 text-center">
//         <h1 className="text-2xl font-bold mb-4">
//           Invalid checkout information
//         </h1>
//         <p className="mb-6">
//           Please select an event and date before proceeding to checkout.
//         </p>
//         <Button asChild>
//           <a href="/events">Browse Events</a>
//         </Button>
//       </div>
//     );
//   }

//   const subtotal = event.price * quantity;
//   const fees = subtotal * 0.05; // 5% service fee
//   const total = subtotal + fees;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsProcessing(true);

//     // Simulate payment processing
//     setTimeout(() => {
//       const orderNumber = generateOrderNumber();

//       // Navigate to confirmation page
//       router.push(
//         `/confirmation?orderNumber=${orderNumber}&eventId=${eventId}&date=${date}&quantity=${quantity}`
//       );
//     }, 2000);
//   };

//   return (
//     <div className="container py-10">
//       <h1 className="text-3xl font-bold mb-6">Checkout</h1>

//       <div className="grid gap-10 lg:grid-cols-3">
//         {/* Order Summary */}
//         <div className="lg:col-span-2">
//           <div className="rounded-lg border p-6 shadow-sm">
//             <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

//             <div className="flex items-start gap-4 mb-6">
//               <div className="h-20 w-20 overflow-hidden rounded-md">
//                 <img
//                   src={event.image || "/placeholder.svg"}
//                   alt={event.name}
//                   className="h-full w-full object-cover"
//                 />
//               </div>
//               <div>
//                 <h3 className="font-medium">{event.name}</h3>
//                 <div className="flex items-center text-sm text-muted-foreground mt-1">
//                   <CalendarDays className="mr-1 h-4 w-4" />
//                   {formatDate(date)}
//                 </div>
//                 <div className="flex items-center text-sm text-muted-foreground mt-1">
//                   <MapPin className="mr-1 h-4 w-4" />
//                   {event.venue}, {event.location}
//                 </div>
//                 <div className="flex items-center text-sm mt-1">
//                   <Ticket className="mr-1 h-4 w-4" />
//                   {quantity} {quantity === 1 ? "ticket" : "tickets"}
//                 </div>
//               </div>
//             </div>

//             <Separator className="my-4" />

//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Subtotal</span>
//                 <span>
//                   <span className="icon-saudi_riyal" />
//                   {subtotal}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Service Fee</span>
//                 <span>
//                   <span className="icon-saudi_riyal" />
//                   {fees}
//                 </span>
//               </div>
//               <Separator className="my-2" />
//               <div className="flex justify-between font-bold">
//                 <span>Total</span>
//                 <span>
//                   <span className="icon-saudi_riyal" />
//                   {total}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Payment Form */}
//         <div className="lg:col-span-1">
//           <form
//             onSubmit={handleSubmit}
//             className="rounded-lg border p-6 shadow-sm"
//           >
//             <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

//             <Tabs defaultValue="card" onValueChange={setPaymentMethod}>
//               <TabsList className="grid w-full grid-cols-2 mb-4">
//                 <TabsTrigger value="card">Credit Card</TabsTrigger>
//                 <TabsTrigger value="paypal">PayPal</TabsTrigger>
//               </TabsList>
//               <TabsContent value="card" className="space-y-4">
//                 <div className="grid gap-2">
//                   <Label htmlFor="name">Cardholder Name</Label>
//                   <Input id="name" defaultValue={user?.name || ""} required />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="card-number">Card Number</Label>
//                   <Input
//                     id="card-number"
//                     placeholder="1234 5678 9012 3456"
//                     required
//                   />
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="expiry">Expiry Date</Label>
//                     <Input id="expiry" placeholder="MM/YY" required />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="cvc">CVC</Label>
//                     <Input id="cvc" placeholder="123" required />
//                   </div>
//                 </div>
//               </TabsContent>
//               <TabsContent
//                 value="paypal"
//                 className="flex justify-center items-center h-40"
//               >
//                 <p className="text-center text-muted-foreground">
//                   You will be redirected to PayPal to complete your payment.
//                 </p>
//               </TabsContent>
//             </Tabs>

//             <div className="mt-6">
//               <Button
//                 type="submit"
//                 className="w-full"
//                 size="lg"
//                 disabled={isProcessing}
//               >
//                 {isProcessing ? (
//                   <span className="flex items-center gap-2">
//                     <CreditCard className="h-4 w-4 animate-pulse" />
//                     Processing...
//                   </span>
//                 ) : (
//                   <span>
//                     Pay <span className="icon-saudi_riyal" />
//                     {total}
//                   </span>
//                 )}
//               </Button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
