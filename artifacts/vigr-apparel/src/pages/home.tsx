import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, User } from "lucide-react";
import { useListProducts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

export default function Home() {
  const { data: productsData, isLoading } = useListProducts();
  const { itemCount, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const subscribeNewsletter = useSubscribeNewsletter();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeNewsletter.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({ title: "Subscribed", description: "Welcome to the covenant." });
          setEmail("");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to subscribe.", variant: "destructive" });
        },
      }
    );
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b border-border"
        style={{ background: "rgba(10,10,10,0.95)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img
                src={logoPath}
                alt="VAA"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)" }}
              />
            </div>
            <span className="font-display text-2xl tracking-[0.25em]">VIGR ANGEL APPAREL</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={scrollToProducts}
              className="font-sans text-[11px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Shop
            </button>
            <a
              href="#about"
              className="font-sans text-[11px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
          </div>

          {/* Account + Cart */}
          <div className="flex items-center gap-1">
          <Link href={isLoggedIn ? "/account/orders" : "/account/login"} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
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

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-[72px]">
        <div className="flex flex-col items-center text-center">
          <div className="w-52 h-52 sm:w-72 sm:h-72 mb-10">
            <img
              src={logoPath}
              alt="VIGR Angel Apparel Logo"
              className="w-full h-full object-contain"
              style={{ filter: "invert(1)" }}
            />
          </div>

          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] tracking-[0.08em] leading-[0.9] mb-6">
            VIGR ANGEL<br />APPAREL
          </h1>
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-muted-foreground mb-12">
            Born in the grit. Worn by the chosen.
          </p>
          <button
            onClick={scrollToProducts}
            data-testid="button-shop-now"
            className="font-display text-2xl tracking-[0.2em] px-14 h-[56px] border border-foreground hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
          >
            SHOP NOW
          </button>
        </div>

        {/* scroll hint */}
        <p className="absolute bottom-8 font-sans text-[9px] tracking-[0.4em] uppercase text-muted-foreground/50 animate-bounce">
          Scroll
        </p>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-foreground text-background py-4 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 24s linear infinite" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 pr-10 font-display text-2xl tracking-[0.3em]">
              <span>VIGR ANGEL APPAREL</span>
              <span className="text-primary">·</span>
              <span>VAA</span>
              <span className="text-primary">·</span>
              <span>CROWN OF THORNS</span>
              <span className="text-primary">·</span>
              <span>GRIT AND GRACE</span>
              <span className="text-primary">·</span>
              <span>UNDERGROUND FAITH</span>
              <span className="text-primary">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-28 px-6 max-w-7xl mx-auto w-full">
        <div className="mb-16 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Collection</p>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] tracking-[0.15em]">THE COLLECTION</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading collection...
          </div>
        ) : !productsData?.data.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products yet — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsData.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-28 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground">About</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] tracking-[0.1em] leading-none">ABOUT VAA</h2>
            <div className="space-y-5 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                VIGR Angel Apparel is more than fabric and thread. It is a testament to resilience, forged in the fires of the underground and sustained by unwavering faith.
              </p>
              <p>
                We build for the outcasts, the believers, and those who carry their cross with pride. Our garments are armor for the modern world — raw, unapologetic, stripped of pretense.
              </p>
              <p>No glitz. No excess. Just truth woven into streetwear.</p>
            </div>
          </div>

          {/* Logo block */}
          <div className="flex justify-center items-center">
            <div className="w-64 h-64">
              <img
                src={logoPath}
                alt="VAA Mark"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)", opacity: 0.85 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-28 px-6 flex flex-col items-center text-center">
        <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Stay Connected</p>
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] tracking-[0.15em] mb-3">JOIN THE COVENANT</h2>
        <p className="font-sans text-xs tracking-[0.2em] text-muted-foreground mb-10">
          Exclusive drops. Raw transmissions. No noise.
        </p>
        <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
          <Input
            type="email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-newsletter-email"
            className="rounded-none border border-border bg-transparent font-sans text-xs tracking-widest h-12 flex-1 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            disabled={subscribeNewsletter.isPending}
            data-testid="button-newsletter-submit"
            className="rounded-none font-display text-xl tracking-[0.2em] h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
          >
            {subscribeNewsletter.isPending ? "..." : "JOIN"}
          </Button>
        </form>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-display text-xl tracking-[0.2em]">VIGR ANGEL APPAREL</span>
          <div className="flex gap-8 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            <button onClick={scrollToProducts} className="hover:text-foreground transition-colors">Shop</button>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <Link href="/dev" className="hover:text-primary transition-colors opacity-40 hover:opacity-100">Dev</Link>
          </div>
          <p className="font-sans text-[10px] tracking-wider text-muted-foreground/50">
            © {new Date().getFullYear()} VIGR Angel Apparel
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  return (
    <div
      className="group flex flex-col border border-border hover:border-foreground/40 transition-colors duration-200"
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-[3/4] bg-[#111] relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 opacity-20">
              <img src={logoPath} alt="" className="w-full h-full object-cover" style={{ filter: "invert(1)" }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] truncate pr-4">{product.name}</h3>
          <span className="font-sans text-xs text-muted-foreground whitespace-nowrap">
            ${(product.price / 100).toFixed(2)}
          </span>
        </div>
        {typeof product.stockCount === "number" && product.stockCount > 0 && product.stockCount < 5 && (
          <p
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary"
            data-testid={`text-low-stock-${product.id}`}
          >
            Only {product.stockCount} left
          </p>
        )}
        <button
          onClick={() => {
            if (!product.inStock) return;
            addToCart(product);
            toast({ title: "Added", description: `${product.name} added to cart.` });
          }}
          disabled={!product.inStock}
          data-testid={`button-add-to-cart-${product.id}`}
          className="w-full border border-border font-sans text-[10px] tracking-[0.3em] uppercase h-10 hover:bg-primary hover:border-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {product.inStock ? "Add to Cart" : "Sold Out"}
        </button>
      </div>
    </div>
  );
}
