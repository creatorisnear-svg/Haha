import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  productId: string;
  productName: string;
  type?: "restock" | "release";
  className?: string;
  label?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NotifyMeButton({
  productId,
  productName,
  type = "restock",
  className,
  label,
}: Props) {
  const { customer } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(customer?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const buttonLabel = label ?? (type === "release" ? "Notify Me When Live" : "Email Me When Back");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to subscribe");
      }
      setDone(true);
      toast({
        title: "You're on the list",
        description:
          type === "release"
            ? `We'll email you when ${productName} drops.`
            : `We'll email you when ${productName} is back in stock.`,
      });
    } catch (err: any) {
      toast({
        title: "Could not save your email",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setDone(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid={`button-notify-${productId}`}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 h-12 px-6 border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background font-display text-sm tracking-[0.2em] uppercase transition-colors"
        }
      >
        <Bell className="w-4 h-4" />
        {buttonLabel}
      </button>
      <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full bg-background border border-border rounded-none p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl tracking-[0.2em] uppercase">
            {type === "release" ? "Notify Me When Live" : "Notify Me When Back"}
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground mt-2 leading-relaxed">
            {type === "release"
              ? `We'll email you the moment ${productName} drops. One message, no spam.`
              : `We'll email you as soon as ${productName} is back in stock. One message, no spam.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="mt-6 text-center space-y-3">
            <p className="font-display text-lg tracking-[0.15em] uppercase">You're on the list.</p>
            <p className="font-sans text-xs text-muted-foreground">
              Check your inbox · we'll only email you once.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                data-testid="input-notify-email"
                className="w-full h-12 bg-transparent border border-border px-3 font-sans text-sm focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              data-testid="button-notify-submit"
              className="w-full h-12 bg-foreground text-background font-display text-sm tracking-[0.25em] uppercase hover:bg-primary hover:text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Notify Me
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
