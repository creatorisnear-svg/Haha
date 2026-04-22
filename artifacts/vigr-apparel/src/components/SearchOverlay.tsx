import { useEffect } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { useSearch } from "@/context/SearchContext";
import { ProductCard } from "@/components/ProductCard";

interface SearchOverlayProps {
  topOffset: number;
  safeAreaTop?: boolean;
}

export function SearchOverlay({ topOffset, safeAreaTop = false }: SearchOverlayProps) {
  const { query, setQuery } = useSearch();
  const { data: productsData, isLoading } = useListProducts();

  const trimmedQuery = query.trim().toLowerCase();
  const isOpen = trimmedQuery.length > 0;

  // Lock body scroll while overlay is open so it feels like a true layer.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const allProducts = productsData?.data ?? [];
  const results = allProducts.filter((p: any) => {
    const haystack = `${p.name ?? ""} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
    return haystack.includes(trimmedQuery);
  });

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-30 bg-background/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      style={{ top: safeAreaTop ? `calc(${topOffset}px + env(safe-area-inset-top))` : topOffset }}
      onClick={() => setQuery("")}
      data-testid="search-overlay"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 sm:mb-10 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">
            Search
          </p>
          <h2 className="font-display text-[clamp(1.75rem,5vw,3.5rem)] tracking-[0.15em] uppercase">
            {results.length} match{results.length === 1 ? "" : "es"} for "{query.trim()}"
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading...
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products match your search.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors underline"
              data-testid="button-overlay-clear"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pb-8">
            {results.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
