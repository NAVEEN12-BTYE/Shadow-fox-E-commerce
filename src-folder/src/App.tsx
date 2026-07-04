import React, { useCallback, useEffect, useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Navbar from "./components/Navbar";
import AIChatWidget from "./components/AIChatWidget";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { SAMPLE_PRODUCTS } from "./sampleData";
import type { Product } from "./types";

export type Page =
  | "home"
  | "product"
  | "cart"
  | "wishlist"
  | "checkout"
  | "orders"
  | "login"
  | "signup"
  | "seller"
  | "admin";

function AppShell() {
  const [page, setPage] = useState<Page>("home");
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setProducts(data);
      }
    } catch {
      // Fall back to bundled sample data if the API is unreachable.
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function navigate(next: Page) {
    setPage(next);
    window.scrollTo(0, 0);
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product);
    navigate("product");
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Navbar navigate={navigate} onSearch={handleSearch} />

      {page === "home" && (
        <HomePage products={products} searchQuery={searchQuery} onSelectProduct={selectProduct} />
      )}
      {page === "product" && selectedProduct && (
        <ProductDetailPage product={selectedProduct} onBack={() => navigate("home")} />
      )}
      {page === "cart" && <CartPage navigate={navigate} />}
      {page === "wishlist" && <WishlistPage products={products} onSelectProduct={selectProduct} />}
      {page === "checkout" && <CheckoutPage navigate={navigate} />}
      {page === "orders" && <OrdersPage navigate={navigate} />}
      {page === "login" && <LoginPage navigate={navigate} />}
      {page === "signup" && <SignupPage navigate={navigate} />}
      {page === "seller" && <SellerDashboardPage products={products} onProductsChanged={loadProducts} />}
      {page === "admin" && <AdminDashboardPage products={products} />}

      <AIChatWidget products={products} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppShell />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
