import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@workspace/api-client-react";

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string | null) => void;
  buyNow: (product: Product, size?: string | null, quantity?: number) => void;
  removeFromCart: (productId: string, size?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: string | null) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  checkoutRequest: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vaa_cart_v2";

function itemKey(productId: string, size?: string | null) {
  return size ? `${productId}__${size}` : productId;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.product &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutRequest, setCheckoutRequest] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / privacy mode failures
    }
  }, [items]);

  const addItems = (product: Product, size: string | null | undefined, qty: number) => {
    setItems((prev) => {
      const key = itemKey(product.id!, size);
      const existing = prev.find((item) => itemKey(item.product.id!, item.size) === key);
      if (existing) {
        return prev.map((item) =>
          itemKey(item.product.id!, item.size) === key
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty, size: size ?? null }];
    });
  };

  const addToCart = (product: Product, size?: string | null) => {
    addItems(product, size, 1);
    setIsOpen(true);
  };

  const buyNow = (product: Product, size?: string | null, quantity: number = 1) => {
    addItems(product, size, Math.max(1, quantity));
    setIsOpen(true);
    setCheckoutRequest((n) => n + 1);
  };

  const removeFromCart = (productId: string, size?: string | null) => {
    const key = itemKey(productId, size);
    setItems((prev) => prev.filter((item) => itemKey(item.product.id!, item.size) !== key));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string | null) => {
    const key = itemKey(productId, size);
    if (quantity < 1) {
      removeFromCart(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        itemKey(item.product.id!, item.size) === key ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce(
    (sum, item) => sum + (item.product.price / 100) * item.quantity,
    0
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isOpen,
        setIsOpen,
        checkoutRequest,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
