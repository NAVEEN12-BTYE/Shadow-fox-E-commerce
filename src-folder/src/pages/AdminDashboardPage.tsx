import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Order, Product } from "../types";

interface Props {
  products: Product[];
}

export default function AdminDashboardPage({ products }: Props) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    });
    return unsubscribe;
  }, [profile]);

  if (profile?.role !== "admin") {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-neutral-500">Admin access only.</div>;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">Total Orders</p>
          <p className="text-2xl font-semibold">{orders.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">Total Revenue</p>
          <p className="text-2xl font-semibold">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <p className="text-sm text-neutral-500">Products Listed</p>
          <p className="text-2xl font-semibold">{products.length}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">{order.customerName || order.customerEmail}</p>
              <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{order.total.toLocaleString("en-IN")}</p>
              <p className="text-xs capitalize text-neutral-500">{order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
