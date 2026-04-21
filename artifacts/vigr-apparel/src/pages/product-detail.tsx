import { useState, useMemo, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, ShoppingCart, User, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const productId = params?.id ?? "";
  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: {
      enabled: !!productId,
      queryKey: getGetProductQueryKey(productId),
    },
  });

  const { addToCart, buyNow, itemCount, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo<string[]>(() => {
    if (!product) return [];
    const list: string[] = Array.isArray((product as any).imageUrls)
      ? (product as any).imageUrls.filter((u: any) => typeof u === "string" && u.trim().length > 0)
      : [];
    if (list.length > 0) return list;
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  useEffect(() => {
    if (activeImage >= images.length) setActiveImage(0);
  }, [images.length, activeImage]);

  const goPrev = () => setActiveImage((i) => (images.length === 0 ? 0 : (i - 1 + images.length) % images.length));
  const goNext = () => setActiveImage((i) => (images.length === 0 ? 0 : (i + 1) % images.length));

  const sizes = (product as any)?.sizes;
  const hasSizes = Array.isArray(sizes) && sizes.length > 0;
  const inStock = !!product?.inStock;
  const stockCount = (product as any)?.stockCount;
  const canAdd = !!product && inStock && (!hasSizes || selectedSize !== null);

  const handleAdd = () => {
    if (!canAdd || !product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product as any, hasSizes ? selectedSize : null);
    }
    toast({
      title: "Added to cart",
      description: `${product.name}${selectedSize ? ` (${selectedSize})` : ""} × ${quantity}`,
    });
  };

  const handleBuyNow = () => {
    if (!canAdd || !product) return;
    buyNow(product as any, hasSizes ? selectedSize : null, quantity);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{ background: "rgba(10,10,10,0.95)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between gap-2">
          <button
            onClick={() => setLocation("/")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
              <img
                src={logoPath}
                alt="VAA"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)" }}
              />
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
              data-testid="button-open-cart"
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh] font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading...
          </div>
        ) : isError || !product ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-6 px-6 text-center">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              Product not found.
            </p>
            <Link
              href="/"
              className="font-display text-lg tracking-[0.2em] border border-foreground px-8 h-12 inline-flex items-center hover:bg-primary hover:border-primary hover:text-white transition-all"
            >
              BACK TO SHOP
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="aspect-[3/4] bg-[#111] relative overflow-hidden border border-border group">
                {images.length > 0 ? (
                  <>
                    <div
                      className="flex h-full w-full transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${activeImage * 100}%)` }}
                    >
                      {images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`${product.name} – ${i + 1}`}
                          className="w-full h-full object-cover flex-shrink-0"
                          data-testid={`img-product-detail-${i}`}
                          draggable={false}
                        />
                      ))}
                    </div>

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goPrev}
                          aria-label="Previous image"
                          data-testid="button-prev-image"
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/70 hover:bg-background border border-border text-foreground transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          aria-label="Next image"
                          data-testid="button-next-image"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/70 hover:bg-background border border-border text-foreground transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveImage(i)}
                              aria-label={`View image ${i + 1}`}
                              className={`h-1.5 transition-all ${
                                activeImage === i
                                  ? "w-6 bg-foreground"
                                  : "w-1.5 bg-foreground/40 hover:bg-foreground/60"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 opacity-20">
                      <img
                        src={logoPath}
                        alt=""
                        className="w-full h-full object-contain"
                        style={{ filter: "invert(1)" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      data-testid={`button-thumb-${i}`}
                      className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 border bg-[#111] overflow-hidden transition-all ${
                        activeImage === i
                          ? "border-foreground"
                          : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {product.category && (
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
                  {product.category}
                </p>
              )}
              <h1
                className="font-display text-3xl sm:text-5xl tracking-[0.1em] uppercase leading-tight mb-4"
                data-testid="text-product-name"
              >
                {product.name}
              </h1>
              <p
                className="font-sans text-2xl sm:text-3xl mb-6"
                data-testid="text-product-price"
              >
                ${(product.price / 100).toFixed(2)}
              </p>

              {!inStock && (
                <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-destructive mb-6">
                  Sold Out
                </p>
              )}

              {inStock && typeof stockCount === "number" && stockCount > 0 && stockCount < 5 && (
                <p
                  className="font-sans text-[11px] tracking-[0.3em] uppercase text-primary mb-6"
                  data-testid="text-low-stock"
                >
                  Only {stockCount} left
                </p>
              )}

              {product.description && (
                <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">
                  {product.description}
                </p>
              )}

              {hasSizes && (
                <div className="mb-8">
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
                    Select Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        data-testid={`button-size-${size}`}
                        className={`h-11 min-w-11 px-4 font-sans text-xs tracking-[0.2em] uppercase border transition-all duration-150 ${
                          selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground/50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
                  Quantity
                </p>
                <div className="inline-flex border border-border">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!inStock}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 font-sans text-lg hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    −
                  </button>
                  <span
                    className="w-12 h-11 flex items-center justify-center font-sans text-sm border-x border-border"
                    data-testid="text-quantity"
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        typeof stockCount === "number" ? Math.min(stockCount, q + 1) : q + 1,
                      )
                    }
                    disabled={!inStock}
                    aria-label="Increase quantity"
                    className="w-11 h-11 font-sans text-lg hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  data-testid="button-add-to-cart-detail"
                  className="rounded-none w-full font-display text-lg sm:text-xl tracking-[0.2em] h-14 bg-foreground text-background hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {!inStock
                    ? "SOLD OUT"
                    : hasSizes && !selectedSize
                    ? "SELECT A SIZE"
                    : "ADD TO CART"}
                </Button>

                {inStock && (
                  <Button
                    onClick={handleBuyNow}
                    disabled={!canAdd}
                    data-testid="button-buy-now-detail"
                    className="rounded-none w-full font-display text-lg sm:text-xl tracking-[0.2em] h-14 bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {hasSizes && !selectedSize ? "SELECT A SIZE" : "BUY NOW"}
                  </Button>
                )}
              </div>

              <Link
                href="/"
                className="mt-6 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Back to Collection
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
