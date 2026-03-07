export enum ProductOrderStatus {
  PENDING = "Pending",
  PAID = "Paid",
  CANCELED = "Canceled",
  REFUNDED = "Refunded",
}

export interface ProductOrder {
  id: string;
  productId: string;
  userId: string;
  price: number;
  orderDate: Date;
  status: ProductOrderStatus;
  paymentMethod?: string;
  invoiceId?: string | null;
  couponId?: string | null;
  discountAmount?: number;
  discountType?: string | null;
}

export interface ProductOrderBuyer {
  order: ProductOrder;
  userName: string;
  userEmail: string;
  userPhone?: string;
}
