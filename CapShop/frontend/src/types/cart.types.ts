export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lineTotal: number;
}

export interface CartDto {
  id: number;
  items: CartItemDto[];
  totalAmount: number;
}
