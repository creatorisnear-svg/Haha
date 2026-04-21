import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-500",
  processing: "text-blue-400",
  shipped: "text-purple-400",
  delivered: "text-green-400",
};

export default function AccountOrders() {
  const { customer, token, isLoggedIn, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLocation("/account/login?redirect=/account/orders"); return; }
    fetch(`${BASE}/api/customers/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, token]);

  const handleLogout = () => { logout(); setLocation("/"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border" style={{ background: "rgba(10,10,10,0.95)" }}>
        <div className="max-w-4xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-[0.25em]">VIGR ANGEL APPAREL</Link>
          <div className="flex items-center gap-6">
            <span className="font-sans text-xs text-muted-foreground tracking-widest uppercase hidden sm:block">{customer?.name}</span>
            <Button variant="ghost" onClick={handleLogout} className="font-sans text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground h-8 px-3">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-2">Account</p>
          <h1 className="font-display text-4xl tracking-[0.15em]">MY ORDERS</h1>
        </div>

        {loading ? (
          <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase">No orders yet</p>
            <Link href="/">
              <Button className="rounded-none font-display tracking-widest bg-foreground text-background hover:bg-primary hover:text-white">
                SHOP NOW
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-border p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg tracking-widest">{order.orderNumber}</p>
                    <p className="font-sans text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-sans text-xs tracking-widest uppercase font-semibold ${STATUS_COLORS[order.status] ?? "text-foreground"}`}>
                      {order.status}
                    </span>
                    <p className="font-sans text-sm text-muted-foreground mt-1">${(order.total / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-14 bg-secondary flex-shrink-0 overflow-hidden">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-sans text-xs uppercase tracking-wider font-medium">{item.productName}</p>
                        <p className="font-sans text-xs text-muted-foreground">Qty: {item.quantity} · ${(item.price / 100).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Shipping to</p>
                  <p className="font-sans text-xs text-foreground">{order.shippingAddress.name}</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}, {order.shippingAddress.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
