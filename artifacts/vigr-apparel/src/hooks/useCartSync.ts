import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

/**
 * When a logged-in customer's cart has items, push a snapshot to the server
 * (debounced). The server uses that snapshot to send a single abandonment
 * reminder if the cart goes untouched for 24h. On checkout, the server
 * clears the snapshot.
 */
export function useCartSync() {
  const { isLoggedIn, token } = useAuth();
  const { items } = useCart();
  const lastSerialized = useRef<string>("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const snapshot = items.map((it) => ({
      productId: it.product.id,
      productName: it.product.name,
      price: it.product.price,
      quantity: it.quantity,
      size: it.size ?? null,
      imageUrl: (it.product as any).imageUrl ?? null,
    }));
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const method = snapshot.length === 0 ? "DELETE" : "PUT";
      fetch("/api/account/cart", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: snapshot.length === 0 ? undefined : JSON.stringify({ items: snapshot }),
      }).catch(() => undefined);
    }, 3000);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [isLoggedIn, token, items]);
}
