import { useEffect } from "react";

export function useJsonLd(id: string, data: unknown | null) {
  useEffect(() => {
    if (!data) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = `jsonld-${id}`;
    el.text = JSON.stringify(data);
    const existing = document.getElementById(`jsonld-${id}`);
    if (existing) existing.remove();
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [id, JSON.stringify(data)]);
}
