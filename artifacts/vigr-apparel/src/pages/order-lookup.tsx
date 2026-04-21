import { useState } from "react";
import { Link } from "wouter";
import { Package, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Carrier = "ups" | "usps" | "fedex" | "dhl" | "unknown";

function detectCarrier(raw: string): Carrier {
  const tn = raw.replace(/\s+/g, "").toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(tn)) return "ups";
  if (/^\d{12}$|^\d{15}$|^\d{20}$|^\d{22}$/.test(tn)) {
    // FedEx: 12 or 15 digits
    if (tn.length === 12 || tn.length === 15) return "fedex";
    // USPS: 20 or 22 digits (often starts with 9)
    if (tn.length === 20 || tn.length === 22) return "usps";
  }
  if (/^(94|93|92|95|82)\d{18,20}$/.test(tn)) return "usps";
  if (/^\d{10,11}$/.test(tn)) return "dhl";
  return "unknown";
}

const CARRIER_INFO: Record<Carrier, { name: string; url: (tn: string) => string }> = {
  ups: { name: "UPS", url: (tn) => `https://www.ups.com/track?tracknum=${encodeURIComponent(tn)}` },
  usps: { name: "USPS", url: (tn) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tn)}` },
  fedex: { name: "FedEx", url: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tn)}` },
  dhl: { name: "DHL", url: (tn) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tn)}` },
  unknown: { name: "Carrier", url: (tn) => `https://parcelsapp.com/en/tracking/${encodeURIComponent(tn)}` },
};

function TrackingPanel({ trackingNumber }: { trackingNumber: string }) {
  const tn = trackingNumber.replace(/\s+/g, "");
  const carrier = detectCarrier(tn);
  const info = CARRIER_INFO[carrier];
  const universalUrl = `https://parcelsapp.com/en/tracking/${encodeURIComponent(tn)}`;

  return (
    <div className="border border-border bg-card">
      <div className="p-4 border-b border-border">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Tracking Number</p>
        <p className="font-mono text-sm break-all" data-testid="text-tracking-number">{trackingNumber}</p>
        {carrier !== "unknown" && (
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary mt-2">
            Detected carrier: {info.name}
          </p>
        )}
      </div>

      <div className="p-4 space-y-2">
        <a
          href={info.url(tn)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 px-4 h-12 bg-foreground text-background font-display text-sm tracking-[0.2em] uppercase hover:bg-primary hover:text-white transition-colors"
          data-testid="link-track-carrier"
        >
          <span>Track with {info.name}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        {carrier !== "unknown" && (
          <a
            href={universalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-4 h-12 border border-border font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            data-testid="link-track-universal"
          >
            <span>Universal tracker</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Live tracker iframe (parcelsapp embeds cleanly) */}
      <div className="border-t border-border bg-[#0a0a0a]">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground p-4 pb-2">Live Status</p>
        <iframe
          src={`https://parcelsapp.com/en/tracking/${encodeURIComponent(tn)}`}
          title="Package tracking"
          loading="lazy"
          className="w-full h-[480px] bg-white border-0"
          data-testid="iframe-tracker"
        />
      </div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"] as const;
type OrderStatus = typeof STATUS_STEPS[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="w-full mt-4">
      {/* Dots + connector line */}
      <div className="flex items-center w-full px-1">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
                  done ? "bg-primary border-primary" : "border-border"
                }`}
              />
              {!isLast && (
                <div
                  className={`h-px flex-1 mx-1 transition-all ${
                    i < currentIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Labels under each dot */}
      <div className="grid grid-cols-4 gap-1 mt-2">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <span
              key={step}
              className={`font-sans text-[9px] sm:text-[10px] tracking-[0.15em] uppercase text-center leading-tight ${
                done ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[step]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderLookup() {
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const params = new URLSearchParams({
        orderNumber: form.orderNumber.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
      });
      const res = await fetch(`${BASE}/api/orders/lookup?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border" style={{ background: "rgba(10,10,10,0.95)" }}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-[0.25em]">VIGR ANGEL APPAREL</Link>
          <Link href="/" className="font-sans text-[11px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Shop
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-[72px] pb-16">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Order Tracking</p>
            <h1 className="font-display text-4xl tracking-widest uppercase mb-2">Track Your Order</h1>
            <p className="font-sans text-sm text-muted-foreground">Enter your order number and email to check your order status.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLookup} className="space-y-4 border border-border p-8 bg-card">
            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
                Order Number
              </Label>
              <Input
                id="orderNumber"
                placeholder="VAA-0001"
                required
                value={form.orderNumber}
                onChange={(e) => setForm((p) => ({ ...p, orderNumber: e.target.value }))}
                className="rounded-none h-11 font-mono text-sm uppercase tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-none h-11 font-sans text-sm"
              />
            </div>
            {error && (
              <p className="font-sans text-xs text-red-400 py-1">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors mt-2"
            >
              {loading ? (
                "LOOKING UP..."
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  FIND ORDER
                </span>
              )}
            </Button>
          </form>

          {/* Result */}
          {order && (
            <div className="mt-8 border border-border bg-card p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Order Number</p>
                  <p className="font-display text-2xl tracking-widest text-primary">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Total</p>
                  <p className="font-sans font-semibold text-lg">${(order.total / 100).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Placed On</p>
                <p className="font-sans text-sm">{new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
              </div>

              {/* Status timeline */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Status</p>
                <StatusTimeline status={order.status as OrderStatus} />
              </div>

              {/* Tracking number + live tracker */}
              {order.trackingNumber && (
                <TrackingPanel trackingNumber={order.trackingNumber} />
              )}

              {/* Items */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.imageUrl && (
                        <div className="w-12 h-14 flex-shrink-0 overflow-hidden bg-secondary">
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium uppercase tracking-wide truncate">
                          {item.productName}{item.size ? ` — ${item.size}` : ""}
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                          Qty: {item.quantity} · ${(item.price / 100).toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-sans text-sm whitespace-nowrap">${(item.price * item.quantity / 100).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping address */}
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Shipping To</p>
                <div className="font-sans text-sm space-y-0.5">
                  <p>{order.shippingAddress.name}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
