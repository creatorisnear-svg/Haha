import { useCallback, useEffect, useState } from "react";

const KEY = "vaa:wishlist";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("vaa:wishlist-changed"));
  } catch {
    /* ignore */
  }
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const sync = () => setIds(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("vaa:wishlist-changed", sync as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vaa:wishlist-changed", sync as EventListener);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    if (!id) return;
    const current = read();
    const exists = current.includes(id);
    const next = exists ? current.filter((p) => p !== id) : [id, ...current];
    write(next);
    return !exists;
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const remove = useCallback((id: string) => {
    write(read().filter((p) => p !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, toggle, has, remove, clear, count: ids.length };
}
