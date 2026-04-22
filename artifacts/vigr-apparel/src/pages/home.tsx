import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Truck, Shield, Flame, Music2 } from "lucide-react";
import { useListProducts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

interface Category { id: string; name: string; slug: string; imageUrl?: string | null; }

export default function Home() {
  const { data: productsData, isLoading } = useListProducts();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const subscribeNewsletter = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const allProducts = productsData?.data ?? [];
  const recentlyAdded = allProducts.filter((p: any) => !!p.featured);
  const displayedProducts = recentlyAdded;

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
      <Header categories={categories} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-[92px] sm:pt-[100px] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="hero-radial glow-pulse w-[80vw] h-[80vw] max-w-[900px] max-h-[900px]" />
        </div>
        <div aria-hidden="true" className="hidden md:block absolute top-28 left-10 font-sans text-[9px] tracking-[0.5em] uppercase text-muted-foreground/40 fade-up">
          VIGR Angel Apparel
        </div>
        <div aria-hidden="true" className="hidden md:block absolute top-28 right-10 font-sans text-[9px] tracking-[0.5em] uppercase text-muted-foreground/40 fade-up">
          Faith / Grit / Grace
        </div>

        <div className="relative flex flex-col items-center text-center w-full">
          <div className="w-40 h-40 sm:w-72 sm:h-72 mb-6 sm:mb-8 fade-up">
            <img
              src={logoPath}
              alt="VIGR Angel Apparel Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(154,33,46,0.35)]"
              style={{ filter: "invert(1)" }}
            />
          </div>

          <h1 className="fade-up-d1 font-display text-[clamp(2.5rem,10vw,8rem)] tracking-[0.05em] sm:tracking-[0.08em] leading-[0.9] mb-6">
            VIGR ANGEL<br />APPAREL
          </h1>
          <p className="fade-up-d2 font-sans text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-muted-foreground mb-10 sm:mb-12 px-2">
            Created like Heaven <span className="text-primary">·</span> Worn With Faith
          </p>
          <div className="fade-up-d3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none px-2 sm:px-0">
            <button
              onClick={scrollToProducts}
              data-testid="button-shop-now"
              className="font-display text-lg sm:text-2xl tracking-[0.15em] sm:tracking-[0.2em] px-8 sm:px-14 h-[52px] sm:h-[56px] border border-foreground bg-foreground text-background hover:bg-primary hover:border-primary hover:text-white transition-all duration-200"
            >
              SHOP NOW
            </button>
            <a
              href="#about"
              className="font-display text-lg sm:text-2xl tracking-[0.15em] sm:tracking-[0.2em] px-8 sm:px-14 h-[52px] sm:h-[56px] flex items-center justify-center border border-foreground/40 text-foreground/80 hover:border-foreground hover:text-foreground transition-all duration-200"
            >
              OUR STORY
            </a>
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-8 flex-col items-center gap-2 fade-up-d4">
          <span className="block w-px h-8 bg-foreground/30" />
          <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-muted-foreground/60">
            Scroll
          </p>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-foreground text-background py-3 sm:py-4 overflow-hidden border-y border-border">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 24s linear infinite" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 sm:gap-10 pr-6 sm:pr-10 font-display text-base sm:text-2xl tracking-[0.2em] sm:tracking-[0.3em]">
              <span>VIGR ANGEL APPAREL</span>
              <span className="text-primary">·</span>
              <span>CREATED LIKE HEAVEN</span>
              <span className="text-primary">·</span>
              <span>VAA</span>
              <span className="text-primary">·</span>
              <span>WORN WITH FAITH</span>
              <span className="text-primary">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TENETS / PILLARS ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-2 sm:gap-6 sm:divide-x divide-border">
          {[
            { Icon: Truck, title: "Fast Shipping", sub: "Tracked worldwide" },
            { Icon: Shield, title: "Secure Checkout", sub: "Stripe encrypted" },
            { Icon: Flame, title: "Made With Faith", sub: "Created like Heaven" },
          ].map(({ Icon, title, sub }, idx) => (
            <div
              key={title}
              className={`flex flex-col sm:flex-row items-center sm:justify-center gap-3 sm:gap-4 text-center sm:text-left ${idx > 0 ? "sm:pl-6" : ""}`}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center border border-border text-foreground">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-display text-[11px] sm:text-base tracking-[0.18em] sm:tracking-[0.2em] leading-tight">{title}</span>
                <span className="hidden sm:block font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">
                  {sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="mb-8 sm:mb-12 text-center">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Browse</p>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] tracking-[0.15em]">SHOP BY CATEGORY</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                data-testid={`card-category-${cat.slug}`}
                className="group relative flex items-end justify-start aspect-square bg-[#111] border border-border hover:border-foreground/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-15px_rgba(154,33,46,0.5)]"
              >
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-[1.04] transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/10" />
                <div className="relative z-10 p-2.5 sm:p-4 w-full">
                  <p className="hidden sm:block font-sans text-[8px] tracking-[0.35em] uppercase text-muted-foreground mb-0.5 group-hover:text-primary/80 transition-colors">Shop</p>
                  <h3 className="font-display text-[11px] sm:text-lg tracking-[0.05em] sm:tracking-[0.1em] leading-tight text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {cat.name.toUpperCase()}
                  </h3>
                  <div className="mt-1.5 sm:mt-2 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── RECENTLY ADDED ── */}
      <section id="products" className="py-16 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 sm:mb-12 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">New In</p>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] tracking-[0.15em]">RECENTLY ADDED</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading collection...
          </div>
        ) : !displayedProducts.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products marked "Recently Added" yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {displayedProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── RECENTLY VIEWED ── */}
      <RecentlyViewed />

      {/* ── ABOUT ── */}
      <section id="about" className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="space-y-8">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground">About</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] tracking-[0.1em] leading-none">
              ABOUT <span className="text-primary">VAA</span>
            </h2>
            <div className="space-y-5 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                VIGR Angel Apparel is more than fabric and thread. It is a quiet testament to faith carried into everyday life.
              </p>
              <p>
                We make clothing for believers and seekers alike: pieces designed with intention, worn with conviction.
              </p>
              <p className="text-foreground/80 italic">Created like Heaven, worn with faith.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-6 border-t border-border">
              {[
                { word: "FAITH", line: "Anchor" },
                { word: "GRIT", line: "Forge" },
                { word: "GRACE", line: "Crown" },
              ].map((t) => (
                <div key={t.word} className="flex flex-col items-center text-center">
                  <span className="font-display text-lg sm:text-3xl tracking-[0.15em] sm:tracking-[0.2em] text-foreground">{t.word}</span>
                  <span className="font-sans text-[8px] sm:text-[9px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-muted-foreground mt-1">{t.line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="hero-radial w-[420px] h-[420px] opacity-60" />
            </div>
            <div className="relative w-44 h-44 sm:w-72 sm:h-72">
              <img
                src={logoPath}
                alt="VAA Mark"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)", opacity: 0.92 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 flex justify-center">
        <div className="relative w-full max-w-2xl border border-border p-8 sm:p-14 flex flex-col items-center text-center">
          <span aria-hidden="true" className="absolute -top-px -left-px w-5 h-5 border-t border-l border-primary" />
          <span aria-hidden="true" className="absolute -top-px -right-px w-5 h-5 border-t border-r border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -left-px w-5 h-5 border-b border-l border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -right-px w-5 h-5 border-b border-r border-primary" />
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-4">Newsletter</p>
          <h2 className="font-display text-3xl sm:text-5xl tracking-[0.15em] mb-3">JOIN THE COVENANT</h2>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground mb-8 max-w-md">
            New drops, stories, and exclusive offers — straight to your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <Input
              type="email"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              data-testid="input-newsletter-email"
              className="rounded-none border border-border bg-transparent font-sans text-xs tracking-widest h-12 flex-1 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              disabled={subscribeNewsletter.isPending}
              data-testid="button-newsletter-submit"
              className="rounded-none font-display text-lg sm:text-xl tracking-[0.2em] h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
            >
              {subscribeNewsletter.isPending ? "..." : "JOIN"}
            </Button>
          </form>
          <p className="mt-6 font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground/60">
            No spam ·{" "}
            <Link
              href="/unsubscribe"
              className="underline-offset-4 hover:underline hover:text-foreground transition-colors"
            >
              Unsubscribe anytime
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-12 pb-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
          <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9">
                <img src={logoPath} alt="VAA" className="w-full h-full object-contain" style={{ filter: "invert(1)" }} />
              </div>
              <span className="font-display text-lg tracking-[0.25em]">VIGR ANGEL APPAREL</span>
            </Link>
            <p className="font-sans text-[11px] text-muted-foreground max-w-xs leading-relaxed">
              Created like Heaven, worn with faith.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.tiktok.com/@vigr.angel.apperl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Music2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground/70 mb-1">Shop</p>
            <button onClick={scrollToProducts} className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">Recently Added</button>
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                {cat.name}
              </Link>
            ))}
            <a href="#about" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Link href="/orders/lookup" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">Track Order</Link>
          </div>

          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground/70 mb-1">Help</p>
            <Link href="/terms" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href={isLoggedIn ? "/account/orders" : "/account/login"} className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">
              {isLoggedIn ? "My Account" : "Sign In"}
            </Link>
            <Link href="/dev" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground/40 hover:text-primary transition-colors">Dev</Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60">
            © {new Date().getFullYear()} VIGR Angel Apparel
          </p>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
            Created like Heaven · Worn With Faith
          </p>
        </div>
      </footer>
    </div>
  );
}
