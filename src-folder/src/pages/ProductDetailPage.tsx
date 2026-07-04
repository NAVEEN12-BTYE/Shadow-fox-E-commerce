import React, { useState } from "react";
import { Heart, Star } from "lucide-react";
import type { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface Props {
  product: Product;
  onBack: () => void;
}

export default function ProductDetailPage({ product, onBack }: Props) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-sm text-neutral-500 mb-6 hover:underline">
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-100">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <p className="text-sm text-neutral-500 uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>

          <div className="flex items-center gap-2 mt-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-neutral-600">
              {product.rating} · {product.reviewsCount} reviews
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-semibold">₹{product.price.toLocaleString("en-IN")}</span>
            {product.originalPrice && (
              <span className="text-lg text-neutral-400 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {product.discount ? (
              <span className="text-sm font-medium text-rose-600">{product.discount}% off</span>
            ) : null}
          </div>

          <p className="text-neutral-600 mt-4 leading-relaxed">{product.description}</p>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Specifications</h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-neutral-800">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm mt-4">
            {product.stock > 0 ? (
              product.stock < 5 ? (
                <span className="text-rose-600 font-medium">Only {product.stock} left in stock!</span>
              ) : (
                <span className="text-emerald-600 font-medium">In stock</span>
              )
            ) : (
              <span className="text-neutral-400 font-medium">Out of stock</span>
            )}
          </p>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border border-neutral-300 rounded-full">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2">
                −
              </button>
              <span className="px-3">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2">
                +
              </button>
            </div>

            <button
              disabled={product.stock === 0}
              onClick={() => addToCart(product, quantity)}
              className="flex-1 bg-neutral-900 text-white font-medium py-3 rounded-full disabled:opacity-40"
            >
              Add to Cart
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className="border border-neutral-300 rounded-full p-3"
            >
              <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
