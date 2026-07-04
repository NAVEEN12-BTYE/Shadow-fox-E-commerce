import React, { useMemo } from "react";
import type { Product } from "../types";
import ProductCard from "../components/ProductCard";

interface Props {
  products: Product[];
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
}

export default function HomePage({ products, searchQuery, onSelectProduct }: Props) {
  const filtered = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const featured = products.filter((p) => p.isFeatured);
  const trending = products.filter((p) => p.isTrending);
  const flashSale = products.filter((p) => p.isFlashSale);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {!searchQuery && (
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-700 text-white rounded-3xl p-10 md:p-16">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl">
            Future of Intelligent Shopping
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Discover premium products, personalized by AI, delivered with elegance.
          </p>
        </section>
      )}

      {searchQuery ? (
        <section>
          <h2 className="text-xl font-semibold mb-4">Results for "{searchQuery}"</h2>
          {filtered.length === 0 ? (
            <p className="text-neutral-500">No products found. Try a different search.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="shrink-0 bg-neutral-100 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </section>

          {flashSale.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">⚡ Flash Sale</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {flashSale.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                ))}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                ))}
              </div>
            </section>
          )}

          {trending.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trending.map((p) => (
                  <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4">All Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
