import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AccountRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || "/account/orders";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      login(data.token, data.customer);
      setLocation(redirect);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="font-display text-sm tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors uppercase">
            ← Back to Store
          </Link>
          <h1 className="font-display text-4xl tracking-widest uppercase mt-6">Create Account</h1>
          <p className="text-muted-foreground mt-2 font-sans text-sm tracking-wide">Join to track your orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="FULL NAME"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="rounded-none border-border bg-transparent font-sans text-sm tracking-widest h-12"
          />
          <Input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            className="rounded-none border-border bg-transparent font-sans text-sm tracking-widest h-12"
          />
          <Input
            type="tel"
            placeholder="PHONE (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            className="rounded-none border-border bg-transparent font-sans text-sm tracking-widest h-12"
          />
          <Input
            type="password"
            placeholder="PASSWORD (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-none border-border bg-transparent font-sans text-sm tracking-widest h-12"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-none font-display text-xl tracking-widest h-12 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-sans">
          Already have an account?{" "}
          <Link href={`/account/login?redirect=${encodeURIComponent(redirect)}`} className="text-foreground hover:text-primary underline underline-offset-4 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
