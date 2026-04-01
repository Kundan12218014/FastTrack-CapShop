export interface ShippingAddressDto {
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  placedAt: string;
  itemCount: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  placedAt: string;
  shippingAddress: ShippingAddressDto;
  items: OrderItemDto[];
}

export interface PlaceOrderRequest {
  shippingAddress: ShippingAddressDto;
  paymentMethod: string;
  transactionId: string;
}

export interface PaymentSimulationResult {
  isSuccess: boolean;
  transactionId: string;
  failureReason?: string;
  message: string;
}

export type OrderStatus =
  | "Draft"
  | "CheckoutStarted"
  | "PaymentPending"
  | "Paid"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "PaymentFailed";
