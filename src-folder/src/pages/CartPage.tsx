import React from "react";
import { Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page) => void;
}

export default function CartPage({ navigate }: Props) {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <button
          onClick={() => navigate("home")}
          className="mt-4 bg-neutral-900 text-white px-6 py-2.5 rounded-full text-sm font-medium"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Shopping Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 bg-white border border-neutral-200 rounded-2xl p-4">
            <img src={item.product.image} alt={item.product.name} className="w-24 h-24 object-cover rounded-xl" />
            <div className="flex-1">
              <h3 className="font-medium">{item.product.name}</h3>
              <p className="text-sm text-neutral-500">{item.product.brand}</p>
              <p className="font-semibold mt-1">₹{item.product.price.toLocaleString("en-IN")}</p>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-neutral-300 rounded-full">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1">
                    −
                  </button>
                  <span className="px-2.5">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1">
                    +
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-neutral-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-neutral-50 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Subtotal</p>
          <p className="text-2xl font-semibold">₹{subtotal.toLocaleString("en-IN")}</p>
        </div>
        <button
          onClick={() => navigate("checkout")}
          className="bg-neutral-900 text-white px-8 py-3 rounded-full font-medium"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
