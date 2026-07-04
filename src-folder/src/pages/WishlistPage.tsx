import React from "react";
import type { Product } from "../types";
import { useWishlist } from "../contexts/WishlistContext";
import ProductCard from "../components/ProductCard";

interface Props {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function WishlistPage({ products, onSelectProduct }: Props) {
  const { items } = useWishlist();
  const wishlistedProducts = products.filter((p) => items.some((i) => i.productId === p.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Wishlist</h1>
      {wishlistedProducts.length === 0 ? (
        <p className="text-neutral-500">No items in your wishlist yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistedProducts.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
          ))}
        </div>
      )}
    </div>
  );
}
