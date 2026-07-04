import React, { useState } from "react";
import { Heart, LogOut, Menu, Search, ShoppingCart, Sparkles, User, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page) => void;
  onSearch: (query: string) => void;
}

export default function Navbar({ navigate, onSearch }: Props) {
  const { currentUser, profile, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query);
    navigate("home");
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button onClick={() => navigate("home")} className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-6 h-6 text-neutral-900" />
          <span className="font-semibold text-lg tracking-tight">AI Commerce</span>
        </button>

        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="w-full bg-neutral-100 rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
            <Search className="w-4 h-4 text-neutral-500" />
          </button>
        </form>

        <div className="hidden md:flex items-center gap-5">
          <button onClick={() => navigate("wishlist")} className="relative">
            <Heart className="w-5 h-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </button>
          <button onClick={() => navigate("cart")} className="relative">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-neutral-900 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("orders")} className="text-sm font-medium hover:underline">
                Orders
              </button>
              {profile?.role === "seller" && (
                <button onClick={() => navigate("seller")} className="text-sm font-medium hover:underline">
                  Seller
                </button>
              )}
              {profile?.role === "admin" && (
                <button onClick={() => navigate("admin")} className="text-sm font-medium hover:underline">
                  Admin
                </button>
              )}
              <button onClick={() => logout()} title="Log out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("login")}
              className="flex items-center gap-1.5 text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-full"
            >
              <User className="w-4 h-4" /> Sign in
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 px-4 py-3 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-neutral-100 rounded-full py-2.5 pl-4 pr-10 text-sm"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </form>
          <div className="flex flex-col gap-2 text-sm font-medium">
            <button onClick={() => { navigate("wishlist"); setMobileOpen(false); }} className="text-left">Wishlist ({wishlistItems.length})</button>
            <button onClick={() => { navigate("cart"); setMobileOpen(false); }} className="text-left">Cart ({itemCount})</button>
            {currentUser ? (
              <>
                <button onClick={() => { navigate("orders"); setMobileOpen(false); }} className="text-left">Orders</button>
                {profile?.role === "seller" && <button onClick={() => { navigate("seller"); setMobileOpen(false); }} className="text-left">Seller Dashboard</button>}
                {profile?.role === "admin" && <button onClick={() => { navigate("admin"); setMobileOpen(false); }} className="text-left">Admin Dashboard</button>}
                <button onClick={() => logout()} className="text-left text-rose-600">Log out</button>
              </>
            ) : (
              <button onClick={() => { navigate("login"); setMobileOpen(false); }} className="text-left">Sign in</button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
