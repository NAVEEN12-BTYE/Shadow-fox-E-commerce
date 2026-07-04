import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import type { WishlistItem } from "../types";

interface WishlistContextValue {
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const GUEST_WISHLIST_KEY = "aicommerce_guest_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (!currentUser) {
      const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const ref = collection(db, "users", currentUser.uid, "wishlist");
    const unsubscribe = onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WishlistItem)));
    });
    return unsubscribe;
  }, [currentUser]);

  function persist(next: WishlistItem[]) {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(next));
  }

  function isWishlisted(productId: string) {
    return items.some((i) => i.productId === productId);
  }

  async function toggleWishlist(productId: string) {
    const existing = items.find((i) => i.productId === productId);

    if (currentUser) {
      if (existing) {
        await deleteDoc(doc(db, "users", currentUser.uid, "wishlist", productId));
      } else {
        await setDoc(doc(db, "users", currentUser.uid, "wishlist", productId), {
          productId,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      let next: WishlistItem[];
      if (existing) {
        next = items.filter((i) => i.productId !== productId);
      } else {
        next = [...items, { id: productId, productId, createdAt: new Date().toISOString() }];
      }
      setItems(next);
      persist(next);
    }
  }

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
