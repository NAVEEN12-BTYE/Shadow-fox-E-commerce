import React from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import type { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: Props) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm"
        aria-label="Toggle wishlist"
      >
        <Heart className={`w-4 h-4 ${wishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-500"}`} />
      </button>

      {product.discount ? (
        <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {product.discount}% OFF
        </span>
      ) : null}

      <div onClick={() => onSelect(product)} className="cursor-pointer">
        <div className="aspect-square overflow-hidden bg-neutral-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">{product.brand}</p>
          <h3 className="font-medium text-neutral-900 line-clamp-1 mt-0.5">{product.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-neutral-600">{product.rating} ({product.reviewsCount})</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-semibold text-neutral-900">₹{product.price.toLocaleString("en-IN")}</span>
            {product.originalPrice ? (
              <span className="text-sm text-neutral-400 line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            ) : null}
          </div>
          {product.stock < 5 && product.stock > 0 ? (
            <p className="text-xs text-rose-600 mt-1">Only {product.stock} left!</p>
          ) : null}
          {product.stock === 0 ? <p className="text-xs text-neutral-400 mt-1">Out of stock</p> : null}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          disabled={product.stock === 0}
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
