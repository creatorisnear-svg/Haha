import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { useSearch } from "@/context/SearchContext";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";

interface Category { id: string; name: string; slug: string; }

export default function SearchPage() {
  const { data: productsData, isLoading } = useListProducts();
  const { query, setQuery } = useSearch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Sync ?q= URL param into the search context on first load so the page
  // is shareable / refresh-friendly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    if (q && q !== query) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allProducts = productsData?.data ?? [];
  const trimmedQuery = query.trim().toLowerCase();
  const results = allProducts.filter((p: any) => {
    if (!trimmedQuery) return false;
    const haystack = `${p.name ?? ""} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
    return haystack.includes(trimmedQuery);
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header categories={categories} />

      <section className="pt-[140px] sm:pt-[160px] pb-16 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-1">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1 mb-6 sm:mb-8 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="mb-8 sm:mb-12 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">
            Search
          </p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,5rem)] tracking-[0.15em] uppercase">
            Search Results
          </h1>
          {trimmedQuery ? (
            <p className="mt-4 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {results.length} match{results.length === 1 ? "" : "es"} for "{query.trim()}"
            </p>
          ) : (
            <p className="mt-4 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Type in the search bar to find products
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading...
          </div>
        ) : !trimmedQuery ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Link
              href="/"
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Browse all products
            </Link>
          </div>
        ) : !results.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products match your search.
            </p>
            <button
              onClick={() => {
                setQuery("");
                navigate("/");
              }}
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {results.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
