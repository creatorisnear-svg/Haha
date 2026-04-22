import { useState } from "react";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { WishlistButton } from "@/components/WishlistButton";
import { Countdown } from "@/components/Countdown";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

export function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const rawSizes = product.sizes;
  const sizes: string[] = Array.isArray(rawSizes)
    ? rawSizes
    : typeof rawSizes === "string" && rawSizes.length > 0
      ? rawSizes.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
  const hasSizes = sizes.length > 0;
  const releaseDate: Date | null = product.releaseDate ? new Date(product.releaseDate) : null;
  const isPreRelease = !!releaseDate && releaseDate.getTime() > Date.now();
  const canAdd = product.inStock && !isPreRelease && (!hasSizes || selectedSize !== null);

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart(product, hasSizes ? selectedSize : null);
    toast({ title: "Added", description: `${product.name}${selectedSize ? ` (${selectedSize})` : ""} added to cart.` });
  };

  const isLowStock =
    typeof product.stockCount === "number" && product.stockCount > 0 && product.stockCount < 5;

  return (
    <div
      className="group relative flex flex-col border border-border hover:border-foreground/60 hover:shadow-[0_18px_40px_-20px_rgba(154,33,46,0.45)] transition-all duration-300 hover:-translate-y-1"
      data-testid={`card-product-${product.id}`}
    >
      <Link
        href={`/products/${product.id}`}
        className="aspect-[3/4] bg-[#111] relative overflow-hidden block cursor-pointer"
        data-testid={`link-product-image-${product.id}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 opacity-20">
              <img src={logoPath} alt="" className="w-full h-full object-cover" style={{ filter: "invert(1)" }} />
            </div>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {(product as any).tag && (
          <span
            className={`absolute top-3 left-3 font-sans text-[9px] uppercase tracking-[0.3em] font-semibold px-2 py-1 bg-background/80 backdrop-blur-[2px] border ${
              ({
                blue: "text-blue-400 border-blue-400/40",
                red: "text-red-400 border-red-400/40",
                green: "text-green-400 border-green-400/40",
                yellow: "text-yellow-300 border-yellow-300/40",
                purple: "text-purple-300 border-purple-300/40",
                white: "text-white border-white/40",
              } as Record<string, string>)[(product as any).tagColor ?? "blue"] ?? "text-blue-400 border-blue-400/40"
            }`}
            data-testid={`text-product-tag-${product.id}`}
          >
            {(product as any).tag}
          </span>
        )}
        {isLowStock && product.inStock && !isPreRelease && (
          <span
            className="absolute bottom-3 left-3 font-sans text-[9px] tracking-[0.3em] uppercase text-primary bg-background/80 backdrop-blur-[2px] border border-primary/50 px-2 py-1"
            data-testid={`text-low-stock-${product.id}`}
          >
            Only {product.stockCount} left
          </span>
        )}

        {isPreRelease && releaseDate && (
          <div className="absolute bottom-3 left-3">
            <Countdown releaseDate={releaseDate} variant="card" />
          </div>
        )}

        {!product.inStock && !isPreRelease && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="font-display text-xl tracking-[0.3em] text-foreground border border-foreground/60 px-5 py-2">
              SOLD OUT
            </span>
          </div>
        )}

        {isPreRelease && (
          <div className="absolute inset-x-0 top-0 bg-foreground/90 text-background py-1.5 text-center font-sans text-[9px] tracking-[0.4em] uppercase">
            Coming Soon
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-foreground/95 text-background py-2.5 flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase">
          <Eye className="w-3.5 h-3.5" />
          Quick View
        </div>
      </Link>
      <WishlistButton productId={product.id} productName={product.name} variant="card" />
      <div className="p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
        <Link
          href={`/products/${product.id}`}
          className="flex items-baseline justify-between gap-3 hover:text-primary transition-colors"
          data-testid={`link-product-name-${product.id}`}
        >
          <h3 className="font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] truncate">{product.name}</h3>
          <span className="font-display text-sm sm:text-base tracking-[0.05em] text-foreground whitespace-nowrap">
            ${(product.price / 100).toFixed(2)}
          </span>
        </Link>
        {hasSizes && (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size: string) => (
              <button
                key={size}
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                className={`min-w-[2.25rem] h-9 px-3 font-sans text-[10px] tracking-[0.15em] uppercase border transition-all duration-150 ${
                  selectedSize === size
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 text-muted-foreground hover:border-foreground/60 hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          data-testid={`button-add-to-cart-${product.id}`}
          className="w-full border border-border font-sans text-[10px] tracking-[0.3em] uppercase h-10 hover:bg-primary hover:border-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {!product.inStock ? "Sold Out" : hasSizes && !selectedSize ? "Select a Size" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
