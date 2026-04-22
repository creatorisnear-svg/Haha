import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ShoppingCart, User, Heart, X } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  inStock?: boolean;
}

export default function WishlistPage() {
  const [, setLocation] = useLocation();
  const { ids, remove } = useWishlist();
  const { itemCount, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      ids.map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.data ?? d ?? null) as Product | null)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setProducts(results.filter((p): p is Product => !!p && !!p.id));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{ background: "rgba(10,10,10,0.95)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between gap-2">
          <button
            onClick={() => setLocation("/")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <img src={logoPath} alt="VAA" className="w-full h-full object-contain" style={{ filter: "invert(1)" }} />
            </div>
            <span className="font-display text-sm sm:text-2xl tracking-[0.15em] sm:tracking-[0.25em] truncate">
              <span className="sm:hidden">VIGR ANGEL</span>
              <span className="hidden sm:inline">VIGR ANGEL APPAREL</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={isLoggedIn ? "/account/orders" : "/account/login"}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-[64px] sm:pt-[72px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10 sm:mb-14">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Saved</p>
            <h1 className="font-display text-3xl sm:text-5xl tracking-[0.1em] uppercase">
              Wishlist
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
              Loading...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
              <Heart className="w-12 h-12 text-muted-foreground/40" />
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground">
                Your wishlist is empty.
              </p>
              <Link
                href="/"
                className="font-display text-lg tracking-[0.2em] border border-foreground px-8 h-12 inline-flex items-center hover:bg-primary hover:border-primary hover:text-white transition-all"
              >
                BROWSE COLLECTION
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => {
                const img =
                  (Array.isArray(p.imageUrls) && p.imageUrls[0]) || p.imageUrl || null;
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col border border-border hover:border-foreground/60 transition-all duration-300"
                    data-testid={`card-wishlist-${p.id}`}
                  >
                    <Link
                      href={`/products/${p.id}`}
                      className="aspect-[3/4] bg-[#111] relative overflow-hidden block"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-20 h-20 opacity-20">
                            <img src={logoPath} alt="" className="w-full h-full object-contain" style={{ filter: "invert(1)" }} />
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(p.id);
                        }}
                        aria-label="Remove from wishlist"
                        data-testid={`button-remove-wishlist-${p.id}`}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-[2px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/60 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {p.inStock === false && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <span className="font-display text-sm tracking-[0.3em] border border-foreground/60 px-3 py-1">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="p-3 sm:p-4 flex items-baseline justify-between gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.15em] truncate hover:text-primary transition-colors"
                      >
                        {p.name}
                      </Link>
                      <span className="font-display text-sm whitespace-nowrap">
                        ${(p.price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
