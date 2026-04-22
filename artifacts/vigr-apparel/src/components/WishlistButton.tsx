import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

interface Props {
  productId: string;
  productName?: string;
  variant?: "card" | "detail";
}

export function WishlistButton({ productId, productName, variant = "card" }: Props) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const saved = has(productId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggle(productId);
    toast({
      title: nowSaved ? "Saved to wishlist" : "Removed from wishlist",
      description: productName,
    });
  };

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        data-testid="button-wishlist-detail"
        className={`inline-flex items-center justify-center gap-2 h-12 px-4 border font-sans text-[10px] tracking-[0.3em] uppercase transition-colors ${
          saved
            ? "border-primary text-primary"
            : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
        }`}
      >
        <Heart className={`w-4 h-4 ${saved ? "fill-primary" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      data-testid={`button-wishlist-${productId}`}
      className={`absolute top-2.5 right-2.5 z-10 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px] border transition-all ${
        saved
          ? "border-primary text-primary"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/60"
      }`}
    >
      <Heart className={`w-[18px] h-[18px] flex-shrink-0 ${saved ? "fill-primary" : ""}`} />
    </button>
  );
}
