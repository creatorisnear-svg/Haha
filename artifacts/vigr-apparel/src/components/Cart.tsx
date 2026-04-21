import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Minus, CheckCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "cart" | "checkout" | "confirmed";

interface Address {
  name: string; line1: string; line2: string;
  city: string; state: string; zip: string; country: string;
}

const emptyAddress: Address = { name: "", line1: "", line2: "", city: "", state: "", zip: "", country: "US" };

export function Cart() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { token, isLoggedIn, customer } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("cart");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const handleClose = () => {
    setIsOpen(false);
    if (step === "confirmed") { setStep("cart"); setAddress(emptyAddress); setConfirmedOrder(null); }
  };

  const handleCheckoutClick = () => {
    if (!isLoggedIn) {
      setIsOpen(false);
      setLocation("/account/login?redirect=/");
      toast({ title: "Sign in required", description: "Please sign in or create an account to checkout." });
      return;
    }
    setAddress((a) => ({ ...a, name: a.name || customer?.name || "" }));
    setPhone((p) => p || customer?.phone || "");
    setStep("checkout");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          shippingAddress: address,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setConfirmedOrder(data.order);
      clearCart();
      setStep("confirmed");
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addr = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [field]: e.target.value }));

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md border-l border-border bg-background flex flex-col p-0" data-testid="cart-drawer">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <SheetTitle className="font-display text-2xl tracking-wide m-0">
            {step === "cart" ? "CART" : step === "checkout" ? "CHECKOUT" : "ORDER PLACED"}
          </SheetTitle>
          <div className="flex items-center gap-2">
            {step === "checkout" && (
              <button onClick={() => setStep("cart")} className="font-sans text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors mr-2">
                ← Back
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close-cart">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ── Cart step ── */}
        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm tracking-wide">
                  YOUR CART IS EMPTY
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-4" data-testid={`cart-item-${item.product.id}`}>
                    <div className="w-20 h-24 bg-card flex-shrink-0 overflow-hidden">
                      {item.product.imageUrl
                        ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-secondary" />}
                    </div>
                    <div className="flex flex-col flex-1 py-1 justify-between">
                      <div>
                        <h3 className="font-medium text-sm font-sans uppercase">{item.product.name}</h3>
                        <p className="text-muted-foreground text-sm">${(item.product.price / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} data-testid={`button-minus-${item.product.id}`}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} data-testid={`button-plus-${item.product.id}`}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest" onClick={() => removeFromCart(item.product.id)} data-testid={`button-remove-${item.product.id}`}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-card flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-sans text-sm tracking-wide text-muted-foreground">SUBTOTAL</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                {!isLoggedIn && (
                  <p className="font-sans text-xs text-muted-foreground tracking-wide mb-3 text-center">
                    Sign in to complete your order
                  </p>
                )}
                <Button className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors" onClick={handleCheckoutClick} data-testid="button-checkout">
                  {isLoggedIn ? "CHECKOUT" : "SIGN IN TO CHECKOUT"}
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Checkout step ── */}
        {step === "checkout" && (
          <form onSubmit={handlePlaceOrder} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Order Summary</p>
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between font-sans text-xs text-muted-foreground py-1">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>${(item.product.price * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-sans text-sm font-semibold border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Shipping Information</p>
                <Input placeholder="Full Name" required value={address.name} onChange={addr("name")} className="rounded-none h-11 text-sm font-sans" />
                <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-none h-11 text-sm font-sans" />
                <Input placeholder="Address Line 1" required value={address.line1} onChange={addr("line1")} className="rounded-none h-11 text-sm font-sans" />
                <Input placeholder="Apartment, suite, etc. (optional)" value={address.line2} onChange={addr("line2")} className="rounded-none h-11 text-sm font-sans" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" required value={address.city} onChange={addr("city")} className="rounded-none h-11 text-sm font-sans" />
                  <Input placeholder="State" required value={address.state} onChange={addr("state")} className="rounded-none h-11 text-sm font-sans" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="ZIP Code" required value={address.zip} onChange={addr("zip")} className="rounded-none h-11 text-sm font-sans" />
                  <Input placeholder="Country" required value={address.country} onChange={addr("country")} className="rounded-none h-11 text-sm font-sans" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex-shrink-0">
              <Button type="submit" disabled={loading} className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
                {loading ? "PLACING ORDER..." : "PLACE ORDER"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Confirmed step ── */}
        {step === "confirmed" && confirmedOrder && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
            <div>
              <h2 className="font-display text-2xl tracking-widest mb-2">ORDER CONFIRMED</h2>
              <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mb-1">Order Number</p>
              <p className="font-display text-3xl tracking-widest text-primary">{confirmedOrder.orderNumber}</p>
            </div>
            <p className="font-sans text-sm text-muted-foreground max-w-xs">
              Thank you for your order! We'll process it shortly. You can track it in your account.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button onClick={() => { handleClose(); setLocation("/account/orders"); }} className="w-full rounded-none font-display tracking-widest bg-foreground text-background hover:bg-primary hover:text-white">
                VIEW MY ORDERS
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full rounded-none font-display tracking-widest">
                CONTINUE SHOPPING
              </Button>
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}
