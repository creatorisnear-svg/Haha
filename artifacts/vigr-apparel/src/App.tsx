import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { Cart } from "@/components/Cart";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CategoryPage from "@/pages/category";
import ProductDetail from "@/pages/product-detail";
import CheckoutSuccess from "@/pages/checkout-success";
import CheckoutCancel from "@/pages/checkout-cancel";
import DevLogin from "@/pages/dev-login";
import DevDashboard from "@/pages/dev-dashboard";
import AccountLogin from "@/pages/account-login";
import AccountRegister from "@/pages/account-register";
import AccountOrders from "@/pages/account-orders";
import OrderLookup from "@/pages/order-lookup";
import Terms from "@/pages/terms";
import Unsubscribe from "@/pages/unsubscribe";
import Wishlist from "@/pages/wishlist";
import { useWishlistSync } from "@/hooks/useWishlistSync";
import { useCartSync } from "@/hooks/useCartSync";

const queryClient = new QueryClient();

function SyncBridge() {
  useWishlistSync();
  useCartSync();
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/account/login" component={AccountLogin} />
      <Route path="/account/register" component={AccountRegister} />
      <Route path="/account/orders" component={AccountOrders} />
      <Route path="/orders/lookup" component={OrderLookup} />
      <Route path="/terms" component={Terms} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/dev" component={DevLogin} />
      <Route path="/dev/dashboard" component={DevDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <TooltipProvider>
              <div className="bg-noise"></div>
              <SyncBridge />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Cart />
              <Toaster />
            </TooltipProvider>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
