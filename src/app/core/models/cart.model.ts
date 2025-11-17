export interface Cart {
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  variantSKU: string;
  quantity: number;
  priceAtAdd: number;
  // Snapshot para evitar queries extras
  productName: string;
  productImage?: string;
  variantSize: string;
  variantColor: string;
}

// Para usuarios anónimos (localStorage)
export interface GuestCartItem {
  productId: string;
  variantSKU: string;
  quantity: number;
  productName: string;
  productImage?: string;
  variantSize: string;
  variantColor: string;
  priceAtAdd: number;
}

export interface AddToCartRequest {
  productId: string;
  variantSKU: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

