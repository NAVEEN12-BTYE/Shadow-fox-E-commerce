import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Order } from "../types";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page) => void;
}

const statusColors: Record<string, string> = {
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function OrdersPage({ navigate }: Props) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    });
    return unsubscribe;
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Sign in to view your orders</h2>
        <button
          onClick={() => navigate("login")}
          className="mt-4 bg-neutral-900 text-white px-6 py-2.5 rounded-full text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Order History</h1>
      {orders.length === 0 ? (
        <p className="text-neutral-500">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                  <p className="font-semibold mt-1">₹{order.total.toLocaleString("en-IN")}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-neutral-100"}`}>
                  {order.status}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {order.items.map((item, idx) => (
                  <p key={idx} className="text-sm text-neutral-600">
                    {item.quantity} × {item.product.name}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
