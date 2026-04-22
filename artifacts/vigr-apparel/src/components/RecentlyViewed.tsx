import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}

interface Props {
  excludeId?: string;
  title?: string;
}

export function RecentlyViewed({ excludeId, title = "Recently Viewed" }: Props) {
  const { ids } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const visibleIds = ids.filter((id) => id !== excludeId);

  useEffect(() => {
    let cancelled = false;
    if (visibleIds.length === 0) {
      setProducts([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    Promise.all(
      visibleIds.map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.data ?? d ?? null) as Product | null)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setProducts(results.filter((p): p is Product => !!p && !!p.id));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join(",")]);

  if (!loaded || products.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-border">
      <div className="mb-6 sm:mb-10 text-center">
        <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-3 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x snap-mandatory">
        {products.map((p) => {
          const img =
            (Array.isArray(p.imageUrls) && p.imageUrls[0]) || p.imageUrl || null;
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              data-testid={`link-recent-${p.id}`}
              className="flex-shrink-0 w-[150px] sm:w-[180px] snap-start group"
            >
              <div className="aspect-[3/4] bg-[#111] border border-border overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt={p.name}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="pt-2 flex items-baseline justify-between gap-2">
                <p className="font-sans text-[11px] uppercase tracking-[0.15em] truncate">
                  {p.name}
                </p>
                <p className="font-sans text-[11px] text-muted-foreground whitespace-nowrap">
                  ${(p.price / 100).toFixed(2)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
