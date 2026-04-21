import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="font-display text-5xl tracking-widest uppercase">Checkout Cancelled</h1>
        <p className="text-muted-foreground font-sans tracking-wide">
          Your order process was cancelled. You have not been charged.
        </p>
        <div className="pt-8">
          <Link href="/">
            <Button className="rounded-none font-display text-xl tracking-widest h-14 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
              BACK TO HOME
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
