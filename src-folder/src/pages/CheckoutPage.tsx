import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import type { Address } from "../types";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page) => void;
}

const emptyAddress: Address = {
  id: "addr-" + Date.now(),
  name: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "India",
  phone: "",
};

export default function CheckoutPage({ navigate }: Props) {
  const { currentUser, profile } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Please sign in to checkout</h2>
        <button
          onClick={() => navigate("login")}
          className="mt-4 bg-neutral-900 text-white px-6 py-2.5 rounded-full text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">🎉 Order placed successfully!</h2>
        <button
          onClick={() => navigate("orders")}
          className="mt-4 bg-neutral-900 text-white px-6 py-2.5 rounded-full text-sm font-medium"
        >
          View Orders
        </button>
      </div>
    );
  }

  async function placeOrder() {
    if (!currentUser) return;
    setPlacing(true);
    try {
      const order = {
        customerId: currentUser.uid,
        customerName: profile?.displayName || currentUser.displayName || "",
        customerEmail: currentUser.email || "",
        items,
        total: subtotal,
        status: "processing",
        address,
        paymentMethod: "Cash on Delivery",
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "users", currentUser.uid, "orders"), order);
      await addDoc(collection(db, "orders"), order);
      await clearCart();
      setPlaced(true);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-medium">Shipping Address</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Full name"
            value={address.name}
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Phone"
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Street address"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm md:col-span-2"
          />
          <input
            placeholder="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="State"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="ZIP code"
            value={address.zipCode}
            onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            placeholder="Country"
            value={address.country}
            onChange={(e) => setAddress({ ...address, country: e.target.value })}
            className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 bg-neutral-50 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Total ({items.length} items)</p>
          <p className="text-2xl font-semibold">₹{subtotal.toLocaleString("en-IN")}</p>
          <p className="text-xs text-neutral-500 mt-1">Payment: Cash on Delivery</p>
        </div>
        <button
          disabled={placing || !address.name || !address.street}
          onClick={placeOrder}
          className="bg-neutral-900 text-white px-8 py-3 rounded-full font-medium disabled:opacity-40"
        >
          {placing ? "Placing order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
