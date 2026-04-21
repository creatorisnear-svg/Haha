import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetAdminSettings, 
  useListProducts,
  getGetAdminSettingsQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DevDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("vaa_admin_token");

  useEffect(() => {
    if (!token) {
      setLocation("/dev");
    }
  }, [token, setLocation]);

  const { data: settings, isLoading: isLoadingSettings } = useGetAdminSettings({
    query: {
      enabled: !!token,
      queryKey: getGetAdminSettingsQueryKey(),
    },
    request: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data: productsData, isLoading: isLoadingProducts } = useListProducts();

  const handleLogout = () => {
    localStorage.removeItem("vaa_admin_token");
    setLocation("/dev");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-4xl tracking-widest uppercase">Admin Dashboard</h1>
            <p className="text-muted-foreground font-sans text-sm tracking-widest uppercase mt-1">SYS_ADMIN // VAACLOTHING.XYZ</p>
          </div>
          <Button 
            variant="outline" 
            className="rounded-none font-sans tracking-widest text-xs uppercase"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </header>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none h-12 w-full justify-start gap-8 p-0">
            <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase">
              Products
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="pt-8">
            <OrdersTab token={token} />
          </TabsContent>
          
          <TabsContent value="products" className="pt-8">
            <ProductsTab products={productsData?.data || []} isLoading={isLoadingProducts} token={token} />
          </TabsContent>
          
          <TabsContent value="settings" className="pt-8">
            <SettingsTab settings={settings} isLoading={isLoadingSettings} token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProductsTab({ products, isLoading, token }: { products: any[], isLoading: boolean, token: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    inStock: true,
    stockCount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
      inStock: true,
      stockCount: "",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: (product.price / 100).toString(),
        imageUrl: product.imageUrl || "",
        category: product.category || "",
        inStock: product.inStock,
        stockCount:
          typeof product.stockCount === "number" ? String(product.stockCount) : "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const trimmedStock = formData.stockCount.trim();
      const parsedStock = trimmedStock === "" ? null : Math.max(0, Math.floor(Number(trimmedStock)));
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100),
        imageUrl: formData.imageUrl || undefined,
        category: formData.category || undefined,
        inStock: parsedStock === null ? formData.inStock : parsedStock > 0,
        stockCount: parsedStock,
      };

      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}`
        : `/api/admin/products`;
        
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save product");

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete product");

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl tracking-widest uppercase">Inventory</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              className="rounded-none font-sans uppercase tracking-widest text-xs h-10 px-6 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
              onClick={() => handleOpenDialog()}
              data-testid="button-add-product"
            >
              + Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-none border-border bg-background p-0">
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle className="font-display text-2xl tracking-widest uppercase">
                {editingProduct ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs uppercase tracking-widest text-muted-foreground">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
                  <Input 
                    id="category" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-xs uppercase tracking-widest text-muted-foreground">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  value={formData.imageUrl} 
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockCount" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Stock Count <span className="lowercase tracking-normal">(leave blank for unlimited)</span>
                </Label>
                <Input
                  id="stockCount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 25"
                  value={formData.stockCount}
                  onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                  className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground tracking-wide">
                  Stock is decremented automatically when an order is placed. When it reaches 0, the product is marked sold out.
                </p>
              </div>
              {formData.stockCount.trim() === "" && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) => setFormData({ ...formData, inStock: !!checked })}
                    className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:text-white"
                  />
                  <Label htmlFor="inStock" className="text-xs uppercase tracking-widest">In Stock</Label>
                </div>
              )}
              <div className="pt-6">
                <Button type="submit" className="w-full rounded-none font-display text-xl tracking-widest h-12 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
                  {editingProduct ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm font-sans tracking-widest text-muted-foreground uppercase">Loading inventory...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.length === 0 ? (
            <div className="text-sm font-sans tracking-widest text-muted-foreground uppercase border border-border border-dashed p-8 text-center">
              No products found.
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex flex-col sm:flex-row gap-4 border border-border p-4 bg-card items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary flex-shrink-0 relative overflow-hidden">
                    {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />}
                  </div>
                  <div>
                    <h3 className="font-sans uppercase tracking-widest font-medium text-sm">{product.name}</h3>
                    <p className="text-muted-foreground text-sm font-sans">${(product.price / 100).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none rounded-none font-sans text-xs uppercase tracking-widest h-10 border-border"
                    onClick={() => handleOpenDialog(product)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none rounded-none font-sans text-xs uppercase tracking-widest h-10 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-500 border-yellow-500",
  processing: "text-blue-400 border-blue-400",
  shipped: "text-purple-400 border-purple-400",
  delivered: "text-green-400 border-green-400",
};

function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-widest uppercase">Orders ({orders.length})</h2>
        <Button variant="outline" onClick={fetchOrders} className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4">Refresh</Button>
      </div>

      {orders.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No orders yet
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-border bg-card p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display text-xl tracking-widest">{order.orderNumber}</span>
                    <span className={`font-sans text-[10px] tracking-widest uppercase border px-2 py-0.5 ${STATUS_COLORS[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-lg font-semibold">${(order.total / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Customer</p>
                  <p className="font-sans text-sm font-medium">{order.customerName}</p>
                  <p className="font-sans text-xs text-muted-foreground">{order.customerEmail}</p>
                  {order.customerPhone && <p className="font-sans text-xs text-muted-foreground">{order.customerPhone}</p>}
                </div>
                <div>
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Ship To</p>
                  <p className="font-sans text-sm">{order.shippingAddress.name}</p>
                  <p className="font-sans text-xs text-muted-foreground">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
                  <p className="font-sans text-xs text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p className="font-sans text-xs text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Items</p>
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between font-sans text-xs py-1">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="text-muted-foreground">${(item.price * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["pending", "processing", "shipped", "delivered"].map((s) => (
                    <Button
                      key={s}
                      variant={order.status === s ? "default" : "outline"}
                      disabled={updatingId === order.id || order.status === s}
                      onClick={() => updateStatus(order.id, s)}
                      className="rounded-none font-sans text-[10px] uppercase tracking-widest h-8 px-3"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ settings, isLoading, token }: { settings: any, isLoading: boolean, token: string }) {
  const [formData, setFormData] = useState({
    stripePublishableKey: "",
    stripeSecretKey: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        stripePublishableKey: settings.stripePublishableKey || "",
        stripeSecretKey: settings.stripeSecretKey || "",
      }));
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        stripePublishableKey: formData.stripePublishableKey || undefined,
        stripeSecretKey: formData.stripeSecretKey || undefined,
      };

      if (formData.newPassword) {
        payload.newPassword = formData.newPassword;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update settings");

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      
      setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
      queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-sm font-sans tracking-widest text-muted-foreground uppercase">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-2 h-2 rounded-full ${settings?.hasStripeConfigured ? 'bg-green-500' : 'bg-destructive'}`} />
        <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
          {settings?.hasStripeConfigured ? 'Stripe Configured' : 'Stripe Not Configured'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 border border-border p-6 bg-card">
          <h2 className="font-display text-2xl tracking-widest uppercase m-0">Payment Configuration</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripePublishableKey" className="text-xs uppercase tracking-widest text-muted-foreground">Stripe Publishable Key</Label>
              <Input 
                id="stripePublishableKey" 
                value={formData.stripePublishableKey} 
                onChange={(e) => setFormData({...formData, stripePublishableKey: e.target.value})}
                placeholder="pk_..."
                className="rounded-none border-border font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey" className="text-xs uppercase tracking-widest text-muted-foreground">Stripe Secret Key</Label>
              <Input 
                id="stripeSecretKey" 
                type="password"
                value={formData.stripeSecretKey} 
                onChange={(e) => setFormData({...formData, stripeSecretKey: e.target.value})}
                placeholder="sk_..."
                className="rounded-none border-border font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 border border-border p-6 bg-card">
          <h2 className="font-display text-2xl tracking-widest uppercase m-0">Security</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs uppercase tracking-widest text-muted-foreground">New Password</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={formData.newPassword} 
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-muted-foreground">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="rounded-none font-display text-xl tracking-widest h-14 px-12 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
          SAVE CHANGES
        </Button>
      </form>
    </div>
  );
}
