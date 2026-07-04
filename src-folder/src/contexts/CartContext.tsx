import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import type { CartItem, Product } from "../types";

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const GUEST_CART_KEY = "aicommerce_guest_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!currentUser) {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    }
  }, [currentUser]);

  // Sync with Firestore when logged in
  useEffect(() => {
    if (!currentUser) return;
    const cartRef = collection(db, "users", currentUser.uid, "cart");
    const unsubscribe = onSnapshot(cartRef, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CartItem)));
    });
    return unsubscribe;
  }, [currentUser]);

  function persistGuestCart(next: CartItem[]) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
  }

  async function addToCart(product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) {
    const existing = items.find((i) => i.product.id === product.id);

    if (currentUser) {
      const itemId = existing ? existing.id : product.id;
      await setDoc(doc(db, "users", currentUser.uid, "cart", itemId), {
        product,
        quantity: existing ? existing.quantity + quantity : quantity,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
      });
    } else {
      let next: CartItem[];
      if (existing) {
        next = items.map((i) => (i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i));
      } else {
        next = [...items, { id: product.id, product, quantity, selectedColor, selectedSize }];
      }
      setItems(next);
      persistGuestCart(next);
    }
  }

  async function removeFromCart(itemId: string) {
    if (currentUser) {
      await deleteDoc(doc(db, "users", currentUser.uid, "cart", itemId));
    } else {
      const next = items.filter((i) => i.id !== itemId);
      setItems(next);
      persistGuestCart(next);
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return removeFromCart(itemId);
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.uid, "cart", itemId), { quantity });
    } else {
      const next = items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
      setItems(next);
      persistGuestCart(next);
    }
  }

  async function clearCart() {
    if (currentUser) {
      await Promise.all(items.map((i) => deleteDoc(doc(db, "users", currentUser.uid, "cart", i.id))));
    } else {
      setItems([]);
      persistGuestCart([]);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
