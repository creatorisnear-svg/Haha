import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Unsubscribe() {
  const search = useSearch();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const fromUrl = params.get("email");
    if (fromUrl) setEmail(fromUrl);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to unsubscribe");
      setDone(true);
      toast({ title: "Done", description: data?.message ?? "You have been unsubscribed." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="bg-noise" />
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-base sm:text-xl tracking-[0.2em] hover:text-primary transition-colors"
          >
            VIGR ANGEL APPAREL
          </Link>
          <Link
            href="/"
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Shop
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-md border border-border p-8 sm:p-10">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3 text-center">
            Newsletter
          </p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-widest uppercase mb-3 text-center">
            Unsubscribe
          </h1>
          <p className="font-sans text-sm text-muted-foreground text-center mb-8 leading-relaxed">
            Enter the email you signed up with to be removed from our mailing list. No more transmissions — we'll respect your wishes.
          </p>

          {done ? (
            <div className="text-center space-y-6">
              <p className="font-sans text-sm text-foreground/90 leading-relaxed">
                If <span className="font-semibold">{email}</span> was on our list, it has been removed.
              </p>
              <Link
                href="/"
                className="inline-block font-display text-lg tracking-[0.2em] px-8 h-12 leading-[3rem] border border-foreground/40 hover:border-foreground hover:bg-foreground hover:text-background transition-all"
              >
                Back to Shop
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-unsubscribe-email"
                className="rounded-none border border-border bg-transparent font-sans text-xs tracking-widest h-12 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-unsubscribe-submit"
                className="rounded-none font-display text-lg tracking-[0.2em] h-12 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
              >
                {isPending ? "..." : "UNSUBSCRIBE"}
              </Button>
              <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 text-center mt-2">
                Changed your mind?{" "}
                <Link href="/" className="text-foreground hover:text-primary transition-colors">
                  Stay subscribed
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
