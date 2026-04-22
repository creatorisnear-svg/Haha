import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingCart, User, Menu, Search, X, Truck, Shield, Flame, Music2, Eye } from "lucide-react";
import { useListProducts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

interface Category { id: string; name: string; slug: string; }

export default function Home() {
  const { data: productsData, isLoading } = useListProducts();
  const { itemCount, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const subscribeNewsletter = useSubscribeNewsletter();
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const allProducts = productsData?.data ?? [];
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = allProducts.filter((p: any) => {
    if (activeCategory && (p.category ?? "").toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }
    if (trimmedQuery) {
      const haystack = `${p.name ?? ""} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
      if (!haystack.includes(trimmedQuery)) return false;
    }
    return true;
  });

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

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-7 flex items-center justify-center gap-2 sm:gap-6 font-sans text-[8.5px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase overflow-hidden whitespace-nowrap">
          <span className="truncate">Created like Heaven · Worn With Faith</span>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav
        className="fixed top-7 left-0 right-0 z-40 border-b border-border backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.85)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between gap-2">
          {/* Hamburger menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open menu"
                data-testid="button-open-menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[360px] bg-background border-r border-border p-0 flex flex-col"
            >
              <SheetHeader className="p-6 border-b border-border">
                <SheetTitle className="font-display text-xl tracking-[0.2em] uppercase text-left flex items-center gap-3">
                  <div className="w-8 h-8">
                    <img src={logoPath} alt="VAA" className="w-full h-full object-contain" style={{ filter: "invert(1)" }} />
                  </div>
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto py-2">
                <button
                  onClick={() => { setActiveCategory(null); setMenuOpen(false); scrollToProducts(); }}
                  className="w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                  data-testid="menu-shop-all"
                >
                  Shop All
                </button>

                {categories.length > 0 && (
                  <div className="border-b border-border py-3">
                    <p className="px-6 pb-2 font-sans text-[9px] tracking-[0.4em] uppercase text-muted-foreground/70">
                      Categories
                    </p>
                    <div className="flex flex-col">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveCategory(cat.name); setMenuOpen(false); scrollToProducts(); }}
                          className="w-full text-left pl-10 pr-6 py-2 font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                          data-testid={`menu-category-${cat.slug}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-6 py-3 border-b border-border">
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Explore</p>
                </div>
                <a
                  href="#about"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                >
                  About
                </a>
                <Link
                  href="/orders/lookup"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                >
                  Track Order
                </Link>
                <Link
                  href={isLoggedIn ? "/account/orders" : "/account/login"}
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                >
                  {isLoggedIn ? "My Account" : "Sign In"}
                </Link>
                <Link
                  href="/dev"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-6 py-4 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 hover:text-primary transition-colors"
                >
                  Admin
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo + brand */}
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-[92px] sm:pt-[100px] overflow-hidden">
        {/* radial glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="hero-radial glow-pulse w-[80vw] h-[80vw] max-w-[900px] max-h-[900px]" />
        </div>
        {/* corner runes — desktop only to avoid mobile collisions */}
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

        {/* scroll hint */}
        <div className="absolute bottom-6 sm:bottom-8 flex flex-col items-center gap-2 fade-up-d4">
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { Icon: Truck, title: "Fast Shipping", sub: "Tracked worldwide" },
            { Icon: Shield, title: "Secure Checkout", sub: "Stripe encrypted" },
            { Icon: Flame, title: "Made With Faith", sub: "Created like Heaven" },
          ].map(({ Icon, title, sub }, idx) => (
            <div
              key={title}
              className={`flex items-center gap-4 sm:gap-5 justify-center sm:justify-center ${idx > 0 ? "pt-6 sm:pt-0 sm:pl-6" : ""}`}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center border border-border text-foreground">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-sm sm:text-base tracking-[0.2em]">{title}</span>
                <span className="font-sans text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                  {sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-16 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 sm:mb-12 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Collection</p>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] tracking-[0.15em]">THE COLLECTION</h2>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="mt-4 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-clear-category"
            >
              Filtered: {activeCategory} · Clear ✕
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-10 sm:mb-14">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search clothes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-product-search"
              className="rounded-none border border-border bg-transparent font-sans text-xs tracking-[0.2em] h-11 pl-10 pr-10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading collection...
          </div>
        ) : !allProducts.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products yet — check back soon.
            </p>
          </div>
        ) : !filteredProducts.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products match your search.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground">About</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] tracking-[0.1em] leading-none">
              ABOUT <span className="text-primary">VAA</span>
            </h2>
            <div className="space-y-5 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                VIGR Angel Apparel is more than fabric and thread — it is a quiet testament to faith carried into everyday life.
              </p>
              <p>
                We make clothing for believers and seekers alike: pieces designed with intention, worn with conviction.
              </p>
              <p className="text-foreground/80 italic">Created like Heaven, worn with faith.</p>
            </div>

            {/* tenets */}
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

          {/* Logo block */}
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
          {/* corner accents */}
          <span aria-hidden="true" className="absolute -top-px -left-px w-5 h-5 border-t border-l border-primary" />
          <span aria-hidden="true" className="absolute -top-px -right-px w-5 h-5 border-t border-r border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -left-px w-5 h-5 border-b border-l border-primary" />
          <span aria-hidden="true" className="absolute -bottom-px -right-px w-5 h-5 border-b border-r border-primary" />

          <p className="font-sans text-[10px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-muted-foreground mb-3">Stay Connected</p>
          <h2 className="font-display text-[clamp(1.75rem,5vw,4rem)] tracking-[0.1em] sm:tracking-[0.15em] mb-3">JOIN THE COVENANT</h2>
          <p className="font-sans text-[11px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground mb-8 sm:mb-10 px-2 max-w-md">
            Exclusive drops. Raw transmissions. No noise.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-sm gap-2 sm:gap-0">
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
              className="rounded-none font-display text-lg sm:text-xl tracking-[0.2em] h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
            >
              {subscribeNewsletter.isPending ? "..." : "JOIN"}
            </Button>
          </form>
          <p className="mt-6 font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground/60">
            No spam · Unsubscribe anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-12 pb-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
          {/* Brand */}
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

          {/* Shop links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground/70 mb-1">Shop</p>
            <button onClick={scrollToProducts} className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">All Products</button>
            <a href="#about" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">About</a>
            <Link href="/orders/lookup" className="font-sans text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors">Track Order</Link>
          </div>

          {/* Help */}
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
            © {new Date().getFullYear()} VIGR Angel Apparel · All sales final
          </p>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
            Created like Heaven · Worn With Faith
          </p>
        </div>
      </footer>
    </div>
  );
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const canAdd = product.inStock && (!hasSizes || selectedSize !== null);

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart(product, hasSizes ? selectedSize : null);
    toast({ title: "Added", description: `${product.name}${selectedSize ? ` (${selectedSize})` : ""} added to cart.` });
  };

  return (
    <div
      className="group flex flex-col border border-border hover:border-foreground/60 transition-all duration-300 hover:-translate-y-1"
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

        {/* sold out overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="font-display text-xl tracking-[0.3em] text-foreground border border-foreground/60 px-5 py-2">
              SOLD OUT
            </span>
          </div>
        )}

        {/* hover quick view */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-foreground/95 text-background py-2.5 flex items-center justify-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase">
          <Eye className="w-3.5 h-3.5" />
          Quick View
        </div>
      </Link>
      <div className="p-5 flex flex-col gap-4">
        {(product as any).tag && (
          <span
            className={`font-sans text-[10px] uppercase tracking-[0.2em] font-semibold ${
              ({
                blue: "text-blue-500",
                red: "text-red-500",
                green: "text-green-500",
                yellow: "text-yellow-400",
                purple: "text-purple-400",
                white: "text-white",
              } as Record<string, string>)[(product as any).tagColor ?? "blue"] ?? "text-blue-500"
            }`}
            data-testid={`text-product-tag-${product.id}`}
          >
            {(product as any).tag}
          </span>
        )}
        <Link
          href={`/products/${product.id}`}
          className="flex items-baseline justify-between hover:text-primary transition-colors"
          data-testid={`link-product-name-${product.id}`}
        >
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] truncate pr-4">{product.name}</h3>
          <span className="font-sans text-xs text-muted-foreground whitespace-nowrap">
            ${(product.price / 100).toFixed(2)}
          </span>
        </Link>
        {typeof product.stockCount === "number" && product.stockCount > 0 && product.stockCount < 5 && (
          <p
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary"
            data-testid={`text-low-stock-${product.id}`}
          >
            Only {product.stockCount} left
          </p>
        )}
        {hasSizes && (
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((size: string) => (
              <button
                key={size}
                onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                className={`h-8 px-2.5 font-sans text-[10px] tracking-[0.2em] uppercase border transition-all duration-150 ${
                  selectedSize === size
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/50"
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
