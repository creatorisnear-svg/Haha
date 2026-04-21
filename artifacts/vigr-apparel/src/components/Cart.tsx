import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Minus, CheckCircle, CreditCard, Tag } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "cart" | "info" | "payment" | "confirmed";

interface InfoForm {
  email: string; name: string; phone: string;
  line1: string; line2: string; city: string; state: string; zip: string; country: string;
  createAccount: boolean; password: string;
}

const defaultInfo: InfoForm = {
  email: "", name: "", phone: "",
  line1: "", line2: "", city: "", state: "", zip: "", country: "US",
  createAccount: false, password: "",
};

const CARD_STYLE = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px",
      "::placeholder": { color: "#6b7280" },
      backgroundColor: "transparent",
    },
    invalid: { color: "#f87171" },
  },
};

interface PromoState {
  code: string;
  applied: boolean;
  discountValue: number;
  discountType: "percent" | "fixed" | null;
  discountAmount: number;
  message: string;
  error: string;
  loading: boolean;
}

const defaultPromo: PromoState = {
  code: "",
  applied: false,
  discountValue: 0,
  discountType: null,
  discountAmount: 0,
  message: "",
  error: "",
  loading: false,
};

// ── Inner payment form (needs Stripe context) ────────────────────────────────
function PaymentForm({
  clientSecret, info, items, token, onSuccess, onBack, promo,
}: {
  clientSecret: string; info: InfoForm; items: any[]; token: string | null;
  onSuccess: (order: any, newToken: string | null, newCustomer: any | null) => void;
  onBack: () => void;
  promo: PromoState;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const subtotal = items.reduce((s: number, i: any) => s + (i.product.price * i.quantity / 100), 0);
  const finalTotal = promo.applied ? Math.max(0, subtotal - promo.discountValue) : subtotal;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setLoading(false); return; }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: info.name, email: info.email },
      },
    });

    if (error) {
      setCardError(error.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      setCardError("Payment was not completed. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, size: i.size ?? undefined })),
          shippingAddress: { name: info.name, line1: info.line1, line2: info.line2, city: info.city, state: info.state, zip: info.zip, country: info.country },
          email: info.email,
          phone: info.phone,
          createAccount: info.createAccount,
          password: info.createAccount ? info.password : undefined,
          paymentIntentId: paymentIntent.id,
          promoCode: promo.applied ? promo.code : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order save failed");
      onSuccess(data.order, data.token ?? null, data.customer ?? null);
    } catch (err: any) {
      toast({ title: "Order error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Order Summary</p>
          {items.map((item: any) => (
            <div key={`${item.product.id}-${item.size ?? ""}`} className="flex justify-between font-sans text-xs text-muted-foreground py-1">
              <span>{item.product.name}{item.size ? ` — ${item.size}` : ""} × {item.quantity}</span>
              <span>${(item.product.price * item.quantity / 100).toFixed(2)}</span>
            </div>
          ))}
          {promo.applied && (
            <div className="flex justify-between font-sans text-xs text-green-400 py-1">
              <span>Promo: {promo.code}</span>
              <span>-${promo.discountValue.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-sans text-sm font-semibold border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Shipping to</p>
          <p className="font-sans text-xs text-foreground">{info.name}</p>
          <p className="font-sans text-xs text-muted-foreground">{info.line1}{info.line2 ? `, ${info.line2}` : ""}, {info.city}, {info.state} {info.zip}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Card Details</p>
          </div>
          <div className="border border-border p-4 bg-card">
            <CardElement options={CARD_STYLE} onChange={() => setCardError(null)} />
          </div>
          {cardError && <p className="font-sans text-xs text-red-400">{cardError}</p>}
          <p className="font-sans text-[10px] text-muted-foreground">Secured by Stripe. We never store your card details.</p>
        </div>
      </div>

      <div className="p-6 border-t border-border space-y-3 flex-shrink-0">
        <Button type="submit" disabled={!stripe || loading} className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
          {loading ? "PROCESSING..." : `PAY $${finalTotal.toFixed(2)}`}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="w-full rounded-none font-sans text-xs uppercase tracking-widest text-muted-foreground">
          ← Back
        </Button>
      </div>
    </form>
  );
}

// ── Main Cart component ──────────────────────────────────────────────────────
export function Cart() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { token, isLoggedIn, customer, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("cart");
  const [info, setInfo] = useState<InfoForm>({ ...defaultInfo });
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [promo, setPromo] = useState<PromoState>({ ...defaultPromo });

  // Pre-fill info from logged-in customer
  useEffect(() => {
    if (isLoggedIn && customer) {
      setInfo((prev) => ({
        ...prev,
        email: prev.email || customer.email,
        name: prev.name || customer.name,
        phone: prev.phone || customer.phone || "",
      }));
    }
  }, [isLoggedIn, customer]);

  const resetCart = () => {
    setStep("cart");
    setInfo({ ...defaultInfo });
    setClientSecret(null);
    setStripePromise(null);
    setConfirmedOrder(null);
    setPromo({ ...defaultPromo });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (step === "confirmed") resetCart();
  };

  const goBack = () => {
    if (step === "payment") setStep("info");
    else if (step === "info") setStep("cart");
  };

  const f = (field: keyof InfoForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((prev) => ({ ...prev, [field]: e.target.value }));

  const handleApplyPromo = async () => {
    if (!promo.code.trim()) return;
    setPromo((p) => ({ ...p, loading: true, error: "", message: "" }));
    try {
      const res = await fetch(`${BASE}/api/promo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promo.code.trim(), orderTotal: total }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo((p) => ({
          ...p,
          applied: true,
          discountValue: data.discountValue,
          discountType: data.discountType,
          discountAmount: data.discountAmount,
          message: data.message,
          error: "",
          loading: false,
        }));
      } else {
        setPromo((p) => ({ ...p, applied: false, discountValue: 0, error: data.message, message: "", loading: false }));
      }
    } catch {
      setPromo((p) => ({ ...p, loading: false, error: "Could not apply code. Try again." }));
    }
  };

  const handleRemovePromo = () => {
    setPromo({ ...defaultPromo });
  };

  const discountedTotal = promo.applied ? Math.max(0, total - promo.discountValue) : total;

  // Proceed from info → payment: create payment intent + load Stripe
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeLoading(true);
    try {
      const configRes = await fetch(`${BASE}/api/config`);
      const config = await configRes.json();

      if (!config.publishableKey) {
        // Stripe not configured — place order directly (dev/testing mode)
        const orderRes = await fetch(`${BASE}/api/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, size: i.size ?? undefined })),
            shippingAddress: { name: info.name, line1: info.line1, line2: info.line2, city: info.city, state: info.state, zip: info.zip, country: info.country },
            email: info.email, phone: info.phone,
            createAccount: info.createAccount,
            password: info.createAccount ? info.password : undefined,
            promoCode: promo.applied ? promo.code : undefined,
          }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Order failed");
        if (orderData.token && orderData.customer) login(orderData.token, orderData.customer);
        clearCart();
        setConfirmedOrder(orderData.order);
        setStep("confirmed");
        return;
      }

      const intentRes = await fetch(`${BASE}/api/payments/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })) }),
      });
      const intentData = await intentRes.json();
      if (!intentRes.ok) throw new Error(intentData.error || "Payment setup failed");

      setClientSecret(intentData.clientSecret);
      setStripePromise(loadStripe(config.publishableKey));
      setStep("payment");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePaymentSuccess = (order: any, newToken: string | null, newCustomer: any | null) => {
    if (newToken && newCustomer) login(newToken, newCustomer);
    clearCart();
    setConfirmedOrder(order);
    setStep("confirmed");
  };

  const stepTitle = { cart: "CART", info: "CHECKOUT", payment: "PAYMENT", confirmed: "ORDER PLACED" }[step];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md border-l border-border bg-background flex flex-col p-0" data-testid="cart-drawer">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <SheetTitle className="font-display text-2xl tracking-wide m-0">{stepTitle}</SheetTitle>
          <div className="flex items-center gap-2">
            {(step === "info" || step === "payment") && (
              <button onClick={goBack} className="font-sans text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors mr-2">
                ← Back
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close-cart">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ── Step 1: Cart ── */}
        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground font-sans text-sm tracking-wide">
                  YOUR CART IS EMPTY
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product.id}-${item.size ?? ""}`} className="flex gap-4" data-testid={`cart-item-${item.product.id}`}>
                    <div className="w-20 h-24 bg-card flex-shrink-0 overflow-hidden">
                      {item.product.imageUrl
                        ? <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-secondary" />}
                    </div>
                    <div className="flex flex-col flex-1 py-1 justify-between">
                      <div>
                        <h3 className="font-medium text-sm font-sans uppercase">{item.product.name}{item.size ? <span className="text-muted-foreground font-normal"> — {item.size}</span> : null}</h3>
                        <p className="text-muted-foreground text-sm">${(item.product.price / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(item.product.id!, item.quantity - 1, item.size)} data-testid={`button-minus-${item.product.id}`}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <button className="px-2 py-1 hover:bg-secondary transition-colors" onClick={() => updateQuantity(item.product.id!, item.quantity + 1, item.size)} data-testid={`button-plus-${item.product.id}`}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest" onClick={() => removeFromCart(item.product.id!, item.size)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-card flex-shrink-0 space-y-4">
                {/* Promo code */}
                {!promo.applied ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Promo code"
                          value={promo.code}
                          onChange={(e) => setPromo((p) => ({ ...p, code: e.target.value.toUpperCase(), error: "", message: "" }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyPromo(); } }}
                          className="rounded-none h-10 text-sm font-sans pl-8 uppercase"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={promo.loading || !promo.code.trim()}
                        className="rounded-none font-sans text-xs uppercase tracking-widest h-10 px-4 border-border"
                      >
                        {promo.loading ? "..." : "Apply"}
                      </Button>
                    </div>
                    {promo.error && <p className="font-sans text-xs text-red-400">{promo.error}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between border border-green-800 bg-green-950/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-green-400" />
                      <span className="font-sans text-xs text-green-400 tracking-widest">{promo.code} — {promo.message}</span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2">×</button>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm tracking-wide text-muted-foreground">SUBTOTAL</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  {promo.applied && (
                    <div className="flex items-center justify-between text-green-400">
                      <span className="font-sans text-xs tracking-wide">DISCOUNT</span>
                      <span className="font-medium text-sm">-${promo.discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  {promo.applied && (
                    <div className="flex items-center justify-between border-t border-border pt-1 mt-1">
                      <span className="font-sans text-sm tracking-wide text-muted-foreground">TOTAL</span>
                      <span className="font-semibold">${discountedTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Button className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors" onClick={() => setStep("info")} data-testid="button-checkout">
                  CHECKOUT
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Info ── */}
        {step === "info" && (
          <form onSubmit={handleProceedToPayment} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Contact</p>
                <div className="space-y-3">
                  <Input placeholder="Email address" type="email" required value={info.email} onChange={f("email")} className="rounded-none h-11 text-sm font-sans" />
                  <Input placeholder="Phone number (optional)" type="tel" value={info.phone} onChange={f("phone")} className="rounded-none h-11 text-sm font-sans" />
                </div>
              </div>

              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Shipping</p>
                <div className="space-y-3">
                  <Input placeholder="Full name" required value={info.name} onChange={f("name")} className="rounded-none h-11 text-sm font-sans" />
                  <Input placeholder="Address" required value={info.line1} onChange={f("line1")} className="rounded-none h-11 text-sm font-sans" />
                  <Input placeholder="Apartment, suite, etc. (optional)" value={info.line2} onChange={f("line2")} className="rounded-none h-11 text-sm font-sans" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" required value={info.city} onChange={f("city")} className="rounded-none h-11 text-sm font-sans" />
                    <Input placeholder="State" required value={info.state} onChange={f("state")} className="rounded-none h-11 text-sm font-sans" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="ZIP" required value={info.zip} onChange={f("zip")} className="rounded-none h-11 text-sm font-sans" />
                    <Input placeholder="Country" required value={info.country} onChange={f("country")} className="rounded-none h-11 text-sm font-sans" />
                  </div>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="createAccount"
                      checked={info.createAccount}
                      onCheckedChange={(v) => setInfo((p) => ({ ...p, createAccount: !!v }))}
                      className="rounded-none"
                    />
                    <Label htmlFor="createAccount" className="font-sans text-xs uppercase tracking-widest cursor-pointer">
                      Save my info &amp; create an account
                    </Label>
                  </div>
                  {info.createAccount && (
                    <Input
                      placeholder="Choose a password (min 6 chars)"
                      type="password"
                      required={info.createAccount}
                      minLength={6}
                      value={info.password}
                      onChange={f("password")}
                      className="rounded-none h-11 text-sm font-sans"
                    />
                  )}
                  {!info.createAccount && (
                    <p className="font-sans text-[10px] text-muted-foreground">
                      Already have an account?{" "}
                      <button type="button" onClick={() => { setIsOpen(false); setLocation("/account/login"); }} className="underline underline-offset-2 hover:text-foreground transition-colors">
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex-shrink-0">
              <Button type="submit" disabled={stripeLoading} className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
                {stripeLoading ? "LOADING..." : "CONTINUE TO PAYMENT"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Payment ── */}
        {step === "payment" && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              info={info}
              items={items}
              token={token}
              onSuccess={handlePaymentSuccess}
              onBack={() => setStep("info")}
              promo={promo}
            />
          </Elements>
        )}

        {/* ── Step 4: Confirmed ── */}
        {step === "confirmed" && confirmedOrder && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
            <div>
              <h2 className="font-display text-2xl tracking-widest mb-2">ORDER CONFIRMED</h2>
              <p className="font-sans text-xs tracking-widest text-muted-foreground uppercase mb-1">Order Number</p>
              <p className="font-display text-3xl tracking-widest text-primary">{confirmedOrder.orderNumber}</p>
            </div>
            <p className="font-sans text-sm text-muted-foreground max-w-xs">
              Thank you! A confirmation email will follow. Track your order in your account.
            </p>
            <div className="flex flex-col gap-3 w-full">
              {isLoggedIn && (
                <Button onClick={() => { handleClose(); setLocation("/account/orders"); }} className="w-full rounded-none font-display tracking-widest bg-foreground text-background hover:bg-primary hover:text-white">
                  VIEW MY ORDERS
                </Button>
              )}
              {!isLoggedIn && (
                <Button variant="outline" onClick={() => { handleClose(); setLocation(`/orders/lookup`); }} className="w-full rounded-none font-display tracking-widest">
                  TRACK ORDER
                </Button>
              )}
              <Button variant="outline" onClick={() => { handleClose(); resetCart(); }} className="w-full rounded-none font-display tracking-widest">
                CONTINUE SHOPPING
              </Button>
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}
