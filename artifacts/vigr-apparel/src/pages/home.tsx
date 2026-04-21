import React, { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Menu } from "lucide-react";
import { useListProducts, useSubscribeNewsletter } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/Screenshot_20260420_195437_TikTok_1776741331060.jpg";

export default function Home() {
  const { data: productsData, isLoading } = useListProducts();
  const { itemCount, setIsOpen } = useCart();
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
          toast({
            title: "Subscribed",
            description: "Welcome to the gritty depths.",
          });
          setEmail("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to subscribe. Try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'transparent' }}>
                <img src={logoPath} alt="VAA Logo" className="w-full h-full object-cover scale-150" style={{ mixBlendMode: 'multiply' }} />
              </div>
              <span className="font-display text-2xl tracking-widest ml-3 hidden sm:block">VAA</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={scrollToProducts} className="font-sans text-xs tracking-widest uppercase hover:text-primary transition-colors">Shop</button>
              <a href="#about" className="font-sans text-xs tracking-widest uppercase hover:text-primary transition-colors">About</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 hover:text-primary transition-colors"
              onClick={() => setIsOpen(true)}
              data-testid="button-open-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-sans">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="flex flex-col items-center text-center max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-48 h-48 sm:w-64 sm:h-64 mb-8" style={{ background: 'transparent' }}>
             <img src={logoPath} alt="VIGR Angel Apparel Logo" className="w-full h-full object-cover scale-125" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl tracking-[0.1em] leading-none mb-6">
            VIGR ANGEL<br />APPAREL
          </h1>
          <p className="font-sans text-muted-foreground text-sm sm:text-base tracking-[0.2em] uppercase mb-12 max-w-md">
            Born in the grit.<br />Worn by the chosen.
          </p>
          <Button 
            onClick={scrollToProducts}
            className="rounded-none font-display text-2xl tracking-[0.15em] h-16 px-12 bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105"
          >
            SHOP NOW
          </Button>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="bg-foreground text-background py-4 border-y border-border">
        <div className="marquee-container">
          <div className="marquee-content font-display text-3xl tracking-widest flex gap-8 whitespace-nowrap">
            <span>VIGR ANGEL APPAREL</span>
            <span>·</span>
            <span>VAA</span>
            <span>·</span>
            <span>CROWN OF THORNS</span>
            <span>·</span>
            <span>GRIT AND GRACE</span>
            <span>·</span>
            <span>UNDERGROUND FAITH</span>
            <span>·</span>
            {/* Duplicate for infinite effect */}
            <span>VIGR ANGEL APPAREL</span>
            <span>·</span>
            <span>VAA</span>
            <span>·</span>
            <span>CROWN OF THORNS</span>
            <span>·</span>
            <span>GRIT AND GRACE</span>
            <span>·</span>
            <span>UNDERGROUND FAITH</span>
            <span>·</span>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section id="products" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center mb-16">
          <h2 className="font-display text-5xl sm:text-7xl tracking-widest text-center">THE DROP</h2>
          <div className="w-12 h-[2px] bg-primary mt-6"></div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground font-sans tracking-widest uppercase">
            Loading collection...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsData?.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-24 sm:py-32 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 order-2 md:order-1">
            <h2 className="font-display text-5xl sm:text-6xl tracking-widest">ABOUT VAA</h2>
            <div className="space-y-6 font-sans text-muted-foreground leading-relaxed text-sm tracking-wide">
              <p>
                VIGR Angel Apparel is more than fabric and thread. It is a testament to resilience, forged in the fires of the underground and sustained by unwavering faith.
              </p>
              <p>
                We build for the outcasts, the believers, and those who carry their cross with pride. Our garments are armor for the modern world—raw, unapologetic, and stripped of pretense.
              </p>
              <p>
                No glitz. No excess. Just truth woven into streetwear.
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center items-center p-8 bg-background border border-border">
            <div className="w-64 h-64" style={{ background: 'transparent' }}>
               <img src={logoPath} alt="VAA Mark" className="w-full h-full object-cover scale-125 opacity-80" style={{ mixBlendMode: 'multiply' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 sm:py-32 border-t border-border flex flex-col items-center justify-center px-6 text-center">
        <h2 className="font-display text-4xl sm:text-5xl tracking-widest mb-4">JOIN THE COVENANT</h2>
        <p className="font-sans text-muted-foreground text-sm tracking-widest uppercase mb-8">Access to exclusive drops and raw transmissions.</p>
        
        <form onSubmit={handleSubscribe} className="flex w-full max-w-md">
          <Input 
            type="email" 
            placeholder="YOUR EMAIL ADDRESS" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-none border-border bg-transparent font-sans tracking-widest h-14 rounded-l-md focus-visible:ring-1 focus-visible:ring-primary flex-1"
          />
          <Button 
            type="submit" 
            disabled={subscribeNewsletter.isPending}
            className="rounded-none font-display text-xl tracking-widest h-14 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
          >
            {subscribeNewsletter.isPending ? "..." : "JOIN"}
          </Button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="font-display text-2xl tracking-widest">
            VIGR ANGEL APPAREL
          </div>
          
          <div className="flex gap-8 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            <button onClick={scrollToProducts} className="hover:text-foreground transition-colors">Shop</button>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <p className="font-sans text-xs tracking-wider text-muted-foreground">
              © {new Date().getFullYear()} VIGR Angel Apparel. All rights reserved.
            </p>
            <Link href="/dev" className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground/50 hover:text-primary transition-colors">
              Dev
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added.`,
    });
  };

  return (
    <div className="group flex flex-col border border-border bg-card overflow-hidden hover:border-foreground transition-colors duration-300">
      <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-sans text-xs tracking-widest uppercase">
            No Image
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-sans text-sm font-medium uppercase tracking-widest pr-4">{product.name}</h3>
          <span className="font-sans text-sm text-muted-foreground">${(product.price / 100).toFixed(2)}</span>
        </div>
        <div className="mt-auto">
          <Button 
            onClick={handleAddToCart}
            disabled={!product.inStock}
            variant="outline"
            className="w-full rounded-none font-sans text-xs tracking-widest uppercase h-12 border-border hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            {product.inStock ? "ADD TO CART" : "SOLD OUT"}
          </Button>
        </div>
      </div>
    </div>
  );
}
