import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function DevLogin() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const adminLogin = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    adminLogin.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          localStorage.setItem("vaa_admin_token", data.token);
          setLocation("/dev/dashboard");
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Invalid password",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-widest uppercase">Admin Access</h1>
          <p className="text-muted-foreground mt-2 font-sans tracking-wide text-sm">VIGR ANGEL APPAREL // SYS_ADMIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-none border-border bg-transparent text-center font-sans tracking-widest h-12 uppercase focus-visible:ring-1 focus-visible:ring-primary"
            data-testid="input-password"
          />
          <Button
            type="submit"
            disabled={adminLogin.isPending}
            className="w-full rounded-none font-display text-xl tracking-widest h-12 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
            data-testid="button-login"
          >
            {adminLogin.isPending ? "VERIFYING..." : "ENTER"}
          </Button>
        </form>

        <div className="text-center pt-8">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
            RETURN TO SITE
          </Link>
        </div>
      </div>
    </div>
  );
}
