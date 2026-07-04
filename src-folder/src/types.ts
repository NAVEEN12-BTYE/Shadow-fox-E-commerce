export type UserRole = "customer" | "seller" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  addresses: Address[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand: string;
  category: string;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  specifications?: Record<string, string>;
  stock: number;
  sellerId?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isFlashSale?: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  items: CartItem[];
  total: number;
  discountApplied?: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  address: Address;
  paymentMethod: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}
