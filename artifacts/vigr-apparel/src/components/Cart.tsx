import React from "react";
import { useCart } from "@/context/CartContext";
import { useCreateCheckout } from "@workspace/api-client-react";
import { X, Plus, Minus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Cart() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, total } = useCart();
  const { toast } = useToast();
  const createCheckout = useCreateCheckout();

  const handleCheckout = () => {
    if (items.length === 0) return;

    const checkoutItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    createCheckout.mutate(
      { data: { items: checkoutItems } },
      {
        onSuccess: (data) => {
          window.location.href = data.url;
        },
        onError: (error: any) => {
          toast({
            title: "Checkout failed",
            description: error?.response?.data?.error || "An error occurred during checkout",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md border-l border-border bg-background flex flex-col p-0" data-testid="cart-drawer">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <SheetTitle className="font-display text-2xl tracking-wide m-0">CART</SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} data-testid="button-close-cart">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm tracking-wide">
              YOUR CART IS EMPTY
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4" data-testid={`cart-item-${item.product.id}`}>
                <div className="w-20 h-24 bg-card flex-shrink-0 relative overflow-hidden">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="flex flex-col flex-1 py-1 justify-between">
                  <div>
                    <h3 className="font-medium text-sm font-sans uppercase">{item.product.name}</h3>
                    <p className="text-muted-foreground text-sm">${(item.product.price / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        className="px-2 py-1 hover:bg-secondary transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        data-testid={`button-minus-${item.product.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        className="px-2 py-1 hover:bg-secondary transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        data-testid={`button-plus-${item.product.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                      onClick={() => removeFromCart(item.product.id)}
                      data-testid={`button-remove-${item.product.id}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <span className="font-sans text-sm tracking-wide text-muted-foreground">SUBTOTAL</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <Button
              className="w-full rounded-none font-display text-xl tracking-widest h-14 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              data-testid="button-checkout"
            >
              {createCheckout.isPending ? "PROCESSING..." : "CHECKOUT"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
