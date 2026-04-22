import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const KEY = "vaa:wishlist";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id: any): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("vaa:wishlist-changed"));
  } catch {
    /* ignore */
  }
}

/**
 * Bridges the localStorage wishlist with the server when the customer is
 * logged in. On login, we union the local list with the server list so the
 * customer sees both. After that, any local change pushes (debounced) to
 * the server. Logout has no effect (the local list stays as guest cache).
 */
export function useWishlistSync() {
  const { isLoggedIn, token, customer } = useAuth();
  const mergedRef = useRef(false);
  const pushTimeoutRef = useRef<number | null>(null);

  // On login → merge & re-fetch server list, write merged result locally.
  useEffect(() => {
    if (!isLoggedIn || !token) {
      mergedRef.current = false;
      return;
    }
    if (mergedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const remote: string[] = Array.isArray(data?.data) ? data.data : [];
        const local = read();
        const merged = Array.from(new Set([...local, ...remote]));
        write(merged);
        // Push merged back so server gets any local-only items.
        await fetch("/api/account/wishlist", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds: merged }),
        });
        mergedRef.current = true;
      } catch {
        /* offline; keep local only */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token, customer?.id]);

  // After merge, push any local change up to the server (debounced 1s).
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const pushNow = () => {
      const ids = read();
      fetch("/api/account/wishlist", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: ids }),
      }).catch(() => undefined);
    };
    const onChange = () => {
      if (!mergedRef.current) return; // wait until initial merge is done
      if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
      pushTimeoutRef.current = window.setTimeout(pushNow, 1000);
    };
    window.addEventListener("vaa:wishlist-changed", onChange);
    return () => {
      window.removeEventListener("vaa:wishlist-changed", onChange);
      if (pushTimeoutRef.current) window.clearTimeout(pushTimeoutRef.current);
    };
  }, [isLoggedIn, token]);
}
