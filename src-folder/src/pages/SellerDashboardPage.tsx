import React, { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Product } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  products: Product[];
  onProductsChanged: () => void;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  brand: "",
  category: "",
  image: "",
  stock: "",
};

export default function SellerDashboardPage({ products, onProductsChanged }: Props) {
  const { profile, currentUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const myProducts = products.filter((p) => p.sellerId === currentUser?.uid);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        brand: form.brand,
        category: form.category,
        image: form.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        stock: Number(form.stock),
        sellerId: currentUser?.uid,
        rating: 0,
        reviewsCount: 0,
      };

      if (editingId) {
        await fetch(`/api/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      onProductsChanged();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      brand: product.brand,
      category: product.category,
      image: product.image,
      stock: String(product.stock),
    });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    onProductsChanged();
  }

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-neutral-500">Seller access only.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">{editingId ? "Edit Product" : "Add Product"}</h1>
        <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-neutral-200 rounded-2xl p-6">
          <input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
            <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
            <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-neutral-900 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {editingId ? "Update" : "Add"} Product
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-neutral-300 text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My Products ({myProducts.length})</h2>
        <div className="space-y-3">
          {myProducts.length === 0 && <p className="text-neutral-500 text-sm">You haven't listed any products yet.</p>}
          {myProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl p-3">
              <img src={p.image} className="w-14 h-14 object-cover rounded-lg" alt={p.name} />
              <div className="flex-1">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-neutral-500">₹{p.price} · Stock: {p.stock}</p>
              </div>
              <button onClick={() => startEdit(p)} className="text-neutral-500 hover:text-neutral-900">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-neutral-500 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
