import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, User, Menu, Search, X, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useSearch } from "@/context/SearchContext";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchOverlay } from "@/components/SearchOverlay";
import logoPath from "@assets/12214-removebg-preview_1776743232072.png";

interface Category { id: string; name: string; slug: string; }

interface HeaderProps {
  categories?: Category[];
}

export function Header({ categories = [] }: HeaderProps) {
  const { itemCount, setIsOpen } = useCart();
  const { isLoggedIn } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { query, setQuery } = useSearch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navHeight = scrolled ? "h-[56px] sm:h-[60px]" : "h-[64px] sm:h-[72px]";

  // Reusable search input, used in two spots: inline in nav (when scrolled)
  // and below the nav as its own row (when at top).
  const renderSearchInput = (compact: boolean) => (
    <div className="relative w-full">
      <Search
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-200 ${
          compact ? "w-3.5 h-3.5" : "w-4 h-4"
        }`}
      />
      <Input
        type="text"
        placeholder={compact ? "Search..." : "Search all products..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="input-product-search"
        className={`rounded-none border border-border bg-transparent font-sans tracking-[0.2em] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all duration-200 ${
          compact ? "h-8 sm:h-9 text-[11px] pl-8" : "h-11 sm:h-12 text-xs pl-10"
        } pr-9`}
      />
      {query && (
        <button
          type="button"
          onMouseDown={(e) => {
            // Use onMouseDown so the click registers before the input's
            // blur handler can hide the button mid-click.
            e.preventDefault();
            setQuery("");
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 z-10"
          data-testid="button-clear-search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-7 flex items-center justify-center gap-2 sm:gap-6 font-sans text-[8.5px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase overflow-hidden whitespace-nowrap">
          <span className="truncate">Created like Heaven · Worn With Faith</span>
        </div>
      </div>

      {/* ── NAV ── */}
      <nav
        className="fixed top-7 left-0 right-0 z-40 border-b border-border backdrop-blur-md transition-[height] duration-200"
        style={{ background: "rgba(10,10,10,0.85)" }}
      >
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 ${navHeight} flex items-center justify-between gap-2 transition-[height] duration-200`}>
          {/* Hamburger menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
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
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                  data-testid="menu-shop-all"
                >
                  Home
                </Link>

                {categories.length > 0 && (
                  <div className="border-b border-border py-3">
                    <p className="px-6 pb-2 font-sans text-[9px] tracking-[0.4em] uppercase text-muted-foreground/70">
                      Categories
                    </p>
                    <div className="flex flex-col">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="w-full text-left pl-10 pr-6 py-2 font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                          data-testid={`menu-category-${cat.slug}`}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-6 py-3 border-b border-border">
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Explore</p>
                </div>
                <a
                  href="/#about"
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
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between w-full text-left px-6 py-4 font-sans text-xs tracking-[0.3em] uppercase border-b border-border hover:bg-foreground/5 transition-colors"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="font-sans text-[9px] tracking-[0.2em] text-primary">
                      {wishlistCount}
                    </span>
                  )}
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

          {/* Logo + brand — collapses to icon only when scrolled to free room for search */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0"
            data-testid="link-home"
          >
            <div
              className={`flex-shrink-0 transition-all duration-500 ease-out ${
                scrolled ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10"
              }`}
            >
              <img
                src={logoPath}
                alt="VAA"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)" }}
              />
            </div>
            <span
              className={`font-display tracking-[0.2em] sm:tracking-[0.25em] whitespace-nowrap transition-all duration-500 ease-out ${
                scrolled ? "hidden" : "inline"
              }`}
            >
              <span className="sm:hidden text-base">VIGR ANGEL</span>
              <span className="hidden sm:inline text-base sm:text-xl">VIGR ANGEL APPAREL</span>
            </span>
          </Link>

          {/* Spacer pushes the right-side icons to the edge when no inline search */}
          <div className="flex-1 min-w-0 mx-2 sm:mx-4">
            {/* Inline search — fades in once scrolled */}
            <div
              className={`w-full max-w-xl mx-auto transform transition-all duration-500 ease-out ${
                scrolled
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
              }`}
            >
              {renderSearchInput(true)}
            </div>
          </div>

          {/* Account + Cart */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
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

        {/* ── SEARCH ROW (under nav) — collapses up into nav when scrolled ── */}
        <div
          className={`overflow-hidden transition-all ease-out ${
            scrolled
              ? "max-h-0 opacity-0 duration-[450ms]"
              : "max-h-[88px] opacity-100 duration-[550ms]"
          }`}
          style={{
            borderTopWidth: scrolled ? 0 : 1,
            borderTopColor: "hsl(var(--border) / 0.6)",
            transitionProperty: "max-height, opacity, border-top-width",
          }}
        >
          <div
            className={`max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 transform transition-all duration-500 ease-out ${
              scrolled ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            <div className="max-w-2xl mx-auto">
              {renderSearchInput(false)}
            </div>
          </div>
        </div>
      </nav>

      {/* ── SEARCH RESULTS OVERLAY ── floats over the current page while
          there is text in the search bar; clearing it dismisses the layer. */}
      <SearchOverlay topOffset={scrolled ? 28 + 60 : 28 + 72 + 56} />
    </>
  );
}
