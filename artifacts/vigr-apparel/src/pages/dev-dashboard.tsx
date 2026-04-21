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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none h-12 w-full justify-start gap-8 p-0 overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Categories
            </TabsTrigger>
            <TabsTrigger value="sizes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Sizes
            </TabsTrigger>
            <TabsTrigger value="promos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Promos
            </TabsTrigger>
            <TabsTrigger value="customers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Customers
            </TabsTrigger>
            <TabsTrigger value="newsletter" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Newsletter
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground font-display tracking-widest text-lg px-0 h-full uppercase flex-shrink-0">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-8">
            <OverviewTab token={token} />
          </TabsContent>

          <TabsContent value="orders" className="pt-8">
            <OrdersTab token={token} />
          </TabsContent>
          
          <TabsContent value="products" className="pt-8">
            <ProductsTab products={productsData?.data || []} isLoading={isLoadingProducts} token={token} />
          </TabsContent>

          <TabsContent value="categories" className="pt-8">
            <CategoriesTab token={token} />
          </TabsContent>

          <TabsContent value="sizes" className="pt-8">
            <SizesTab token={token} />
          </TabsContent>
          
          <TabsContent value="promos" className="pt-8">
            <PromoCodesTab token={token} />
          </TabsContent>

          <TabsContent value="customers" className="pt-8">
            <CustomersTab token={token} />
          </TabsContent>

          <TabsContent value="newsletter" className="pt-8">
            <NewsletterTab token={token} />
          </TabsContent>

          <TabsContent value="settings" className="pt-8">
            <SettingsTab settings={settings} isLoading={isLoadingSettings} token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const FALLBACK_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ProductsTab({ products, isLoading, token }: { products: any[], isLoading: boolean, token: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(FALLBACK_SIZES);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
    fetch("/api/sizes")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.data ?? []).map((s: any) => s.label);
        setAvailableSizes(list.length > 0 ? list : FALLBACK_SIZES);
      })
      .catch(() => setAvailableSizes(FALLBACK_SIZES));
  }, [isDialogOpen]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrls: [""] as string[],
    category: "",
    inStock: true,
    stockCount: "",
    sizes: [] as string[],
    tag: "",
    tagColor: "blue",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrls: [""],
      category: "",
      inStock: true,
      stockCount: "",
      sizes: [],
      tag: "",
      tagColor: "blue",
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      const existingImages: string[] = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
        ? product.imageUrls
        : product.imageUrl
        ? [product.imageUrl]
        : [""];
      setFormData({
        name: product.name,
        description: product.description || "",
        price: (product.price / 100).toString(),
        imageUrls: existingImages.length > 0 ? existingImages : [""],
        category: product.category || "",
        inStock: product.inStock,
        stockCount:
          typeof product.stockCount === "number" ? String(product.stockCount) : "",
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        tag: (product as any).tag ?? "",
        tagColor: (product as any).tagColor ?? "blue",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const updateImageUrl = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.imageUrls];
      next[index] = value;
      return { ...prev, imageUrls: next };
    });
  };

  const addImageUrl = () => {
    setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ""] }));
  };

  const removeImageUrl = (index: number) => {
    setFormData((prev) => {
      const next = prev.imageUrls.filter((_, i) => i !== index);
      return { ...prev, imageUrls: next.length > 0 ? next : [""] };
    });
  };

  const moveImageUrl = (index: number, dir: -1 | 1) => {
    setFormData((prev) => {
      const next = [...prev.imageUrls];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, imageUrls: next };
    });
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const trimmedStock = formData.stockCount.trim();
      const parsedStock = trimmedStock === "" ? null : Math.max(0, Math.floor(Number(trimmedStock)));
      const cleanedImages = formData.imageUrls.map((u) => u.trim()).filter((u) => u.length > 0);
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100),
        imageUrls: cleanedImages,
        imageUrl: cleanedImages[0] ?? undefined,
        category: formData.category || undefined,
        inStock: parsedStock === null ? formData.inStock : parsedStock > 0,
        stockCount: parsedStock,
        sizes: formData.sizes.length > 0 ? formData.sizes : null,
        tag: formData.tag.trim() || null,
        tagColor: formData.tag.trim() ? formData.tagColor : null,
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
          <DialogContent className="sm:max-w-[500px] rounded-none border-border bg-background p-0 max-h-[90vh] flex flex-col gap-0 overflow-hidden">
            <DialogHeader className="p-6 border-b border-border flex-shrink-0">
              <DialogTitle className="font-display text-2xl tracking-widest uppercase">
                {editingProduct ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
            >
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
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full h-10 rounded-none border border-border bg-background text-foreground font-sans text-sm px-3 focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
                  >
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {formData.category && !categories.find((c) => c.name === formData.category) && (
                      <option value={formData.category}>{formData.category} (legacy)</option>
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[10px] text-muted-foreground tracking-wide">
                      No categories yet — create one in the Categories tab.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Images <span className="lowercase tracking-normal">(first one is the main image)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="font-sans text-[10px] uppercase tracking-widest text-primary hover:underline"
                    data-testid="button-add-image"
                  >
                    + Add image
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          value={url}
                          placeholder={idx === 0 ? "Main image URL" : `Image ${idx + 1} URL`}
                          onChange={(e) => updateImageUrl(idx, e.target.value)}
                          className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                          data-testid={`input-image-url-${idx}`}
                        />
                        {url.trim() && (
                          <div className="w-16 h-16 border border-border bg-[#111] overflow-hidden">
                            <img
                              src={url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveImageUrl(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          className="w-7 h-7 border border-border text-xs hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageUrl(idx, 1)}
                          disabled={idx === formData.imageUrls.length - 1}
                          aria-label="Move down"
                          className="w-7 h-7 border border-border text-xs hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(idx)}
                          aria-label="Remove image"
                          className="w-7 h-7 border border-destructive text-destructive text-xs hover:bg-destructive hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Sizes Available</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...availableSizes, ...formData.sizes])).map((size) => {
                    const isLegacy = !availableSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`h-8 px-3 font-sans text-xs uppercase tracking-widest border transition-all ${
                          formData.sizes.includes(size)
                            ? "border-primary bg-primary text-white"
                            : "border-border text-muted-foreground hover:border-foreground/50"
                        }`}
                      >
                        {size}{isLegacy ? " (legacy)" : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground tracking-wide">
                  Manage the available size list in the Sizes tab. Leave all unselected if this product has no size options.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Tag <span className="lowercase tracking-normal">(optional badge, e.g. "Free shipping")</span>
                </Label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Input
                    id="tag"
                    maxLength={60}
                    placeholder="Free shipping"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <select
                    value={formData.tagColor}
                    onChange={(e) => setFormData({ ...formData, tagColor: e.target.value })}
                    disabled={!formData.tag.trim()}
                    className="h-10 rounded-none border border-border bg-background text-foreground font-sans text-sm px-2 focus-visible:ring-1 focus-visible:ring-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="purple">Purple</option>
                    <option value="white">White</option>
                  </select>
                </div>
                {formData.tag.trim() && (
                  <div className="pt-1">
                    <span
                      className={`inline-block font-sans text-[10px] uppercase tracking-[0.2em] font-semibold ${
                        ({
                          blue: "text-blue-500",
                          red: "text-red-500",
                          green: "text-green-500",
                          yellow: "text-yellow-400",
                          purple: "text-purple-400",
                          white: "text-white",
                        } as Record<string, string>)[formData.tagColor] ?? "text-blue-500"
                      }`}
                    >
                      {formData.tag}
                    </span>
                    <span className="ml-2 text-[10px] text-muted-foreground tracking-wide">preview</span>
                  </div>
                )}
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
  const [view, setView] = useState<"active" | "archived">("active");
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
    let trackingNumber: string | undefined;
    if (status === "shipped") {
      const tn = window.prompt(
        "Enter the tracking number for this order.\n\nThe customer will receive a shipping confirmation email with this number."
      );
      if (tn === null) return;
      const trimmed = tn.trim();
      if (!trimmed) {
        toast({ title: "Tracking number required", description: "A tracking number is required to mark an order as shipped.", variant: "destructive" });
        return;
      }
      trackingNumber = trimmed;
    }
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, ...(trackingNumber ? { trackingNumber } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      const data = await res.json().catch(() => ({}));
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status, trackingNumber: data.order?.trackingNumber ?? trackingNumber ?? o.trackingNumber } : o));
      toast({
        title:
          status === "shipped"
            ? "Marked as shipped"
            : status === "delivered"
            ? "Marked as delivered & archived"
            : "Status updated",
        description:
          status === "shipped"
            ? "Shipping email sent to the customer."
            : status === "delivered"
            ? "Delivery email sent. Order moved to Archived tab."
            : undefined,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Permanently delete order ${orderNumber}?\n\nThis removes it from the database and all reports (Overview, Tax Summary, etc.). Use this for test orders only — it cannot be undone.`)) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete");
      }
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast({ title: "Order deleted", description: `${orderNumber} removed from your records.` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to delete order", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading orders...</div>;

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const archivedOrders = orders.filter((o) => o.status === "delivered");
  const visibleOrders = view === "active" ? activeOrders : archivedOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl tracking-widest uppercase">Orders ({orders.length})</h2>
        <Button variant="outline" onClick={fetchOrders} className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4">Refresh</Button>
      </div>

      <div className="flex gap-0 border-b border-border">
        <button
          onClick={() => setView("active")}
          className={`font-display tracking-widest text-sm uppercase px-4 py-2 border-b-2 -mb-px transition-colors ${
            view === "active"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeOrders.length})
        </button>
        <button
          onClick={() => setView("archived")}
          className={`font-display tracking-widest text-sm uppercase px-4 py-2 border-b-2 -mb-px transition-colors ${
            view === "archived"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Archived ({archivedOrders.length})
        </button>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          {view === "active" ? "No active orders" : "No archived orders yet"}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
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

              {order.trackingNumber && (
                <div className="border-t border-border pt-4">
                  <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Tracking Number</p>
                  <p className="font-mono text-sm break-all">{order.trackingNumber}</p>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Items</p>
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-baseline font-sans text-xs py-1 gap-3">
                    <span className="flex-1">
                      {item.productName}
                      {item.size && (
                        <span
                          className="ml-2 inline-block border border-border px-1.5 py-0.5 text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
                          data-testid={`order-item-size-${i}`}
                        >
                          Size: {item.size}
                        </span>
                      )}
                      <span className="ml-2 text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">${(item.price * item.quantity / 100).toFixed(2)}</span>
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

              <div className="border-t border-border pt-4 flex justify-end">
                <Button
                  variant="outline"
                  disabled={updatingId === order.id}
                  onClick={() => deleteOrder(order.id, order.orderNumber)}
                  className="rounded-none font-sans text-[10px] uppercase tracking-widest h-8 px-3 border-destructive text-destructive hover:bg-destructive hover:text-white"
                  data-testid={`button-delete-order-${order.orderNumber}`}
                >
                  Delete Order
                </Button>
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

const BASE_ADMIN = import.meta.env.BASE_URL.replace(/\/$/, "");

function CustomersTab({ token }: { token: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{
    customerId: string;
    name: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${BASE_ADMIN}/api/admin/customers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCustomers(d.data ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleReset = async (c: any) => {
    if (!confirm(
      `Reset password for ${c.name} (${c.email})?\n\n` +
      `Their current password will stop working immediately. ` +
      `You'll be shown a one-time temporary password to share with them through a secure channel.`
    )) return;
    setResettingId(c.id);
    try {
      const res = await fetch(`${BASE_ADMIN}/api/admin/customers/${c.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setResetResult({ customerId: c.id, name: c.name, email: c.email, tempPassword: data.temporaryPassword });
      setCopied(false);
      fetchCustomers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResettingId(null);
    }
  };

  const handleCopy = async () => {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select and copy manually.", variant: "destructive" });
    }
  };

  if (loading) return <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-widest uppercase">Customers ({customers.length})</h2>
      </div>

      <div className="border border-border bg-card/50 p-4">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-1">Note on Passwords</p>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          Customer passwords are stored as one-way encrypted hashes and cannot be viewed —
          not by you, not by anyone. If a customer is locked out, use{" "}
          <span className="text-foreground">Reset Password</span> to issue a one-time temporary
          password you can share with them.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No registered customers yet
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div
              key={c.id}
              className="border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              data-testid={`customer-row-${c.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm uppercase tracking-widest">{c.name}</p>
                <p className="font-sans text-xs text-muted-foreground break-all">{c.email}</p>
                {c.phone && <p className="font-sans text-xs text-muted-foreground">{c.phone}</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <p className="font-sans text-[11px] text-muted-foreground">
                    Joined {new Date(c.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                  <p className="font-sans text-[11px] text-muted-foreground">
                    Password {c.passwordChangedAt
                      ? `last changed ${new Date(c.passwordChangedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                      : "never reset"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => handleReset(c)}
                disabled={resettingId === c.id}
                className="rounded-none font-sans text-[11px] uppercase tracking-widest h-9 px-4 flex-shrink-0"
                data-testid={`button-reset-password-${c.id}`}
              >
                {resettingId === c.id ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <DialogContent className="rounded-none border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-widest uppercase">
              Temporary Password
            </DialogTitle>
          </DialogHeader>
          {resetResult && (
            <div className="space-y-4">
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Customer</p>
                <p className="font-sans text-sm text-foreground">{resetResult.name}</p>
                <p className="font-sans text-xs text-muted-foreground break-all">{resetResult.email}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">
                  One-Time Password
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 border border-border bg-background px-3 py-2 font-mono text-sm break-all select-all">
                    {resetResult.tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-none font-sans text-[11px] uppercase tracking-widest h-auto px-3"
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="border border-yellow-900/40 bg-yellow-950/20 p-3">
                <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-yellow-500/80 mb-1">Important</p>
                <ul className="font-sans text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>This password will not be shown again.</li>
                  <li>Share it through a secure channel (not public chat or email forwards).</li>
                  <li>Tell the customer to log in and change it immediately.</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setResetResult(null)}
                  className="rounded-none font-sans text-xs uppercase tracking-widest"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewsletterTab({ token }: { token: string }) {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "" });
  const { toast } = useToast();

  const fetchSubscribers = () => {
    setLoading(true);
    fetch(`${BASE_ADMIN}/api/admin/newsletter/subscribers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSubscribers(d.data ?? []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    if (!confirm(`Send this email to all ${subscribers.length} subscriber(s)?`)) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_ADMIN}/api/admin/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: form.subject, body: form.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      const failed = typeof data.failed === "number" ? data.failed : 0;
      if (failed > 0) {
        toast({
          title: `Sent to ${data.sent}, failed for ${failed}`,
          description: (data.errors?.[0] as string) ?? "Some subscribers were not reachable.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Sent!", description: `Newsletter delivered to ${data.sent} subscriber(s).` });
        setForm({ subject: "", body: "" });
      }
    } catch (err: any) {
      toast({
        title: "Newsletter failed",
        description: err.message ?? "Failed to send",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-widest uppercase">Newsletter</h2>
          {!loading && (
            <p className="font-sans text-xs text-muted-foreground mt-1 tracking-widest">
              {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={fetchSubscribers} className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4">
          Refresh
        </Button>
      </div>

      {subscribers.length === 0 && !loading ? (
        <div className="border border-dashed border-border p-8 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No subscribers yet
        </div>
      ) : (
        <>
          <div className="border border-border bg-card p-4 max-h-40 overflow-y-auto space-y-1">
            <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">Subscriber List</p>
            {subscribers.map((email) => (
              <p key={email} className="font-sans text-xs text-muted-foreground">{email}</p>
            ))}
          </div>

          <form onSubmit={handleSend} className="space-y-4 border border-border bg-card p-6">
            <h3 className="font-display text-lg tracking-widest uppercase">Send Email Blast</h3>
            <div className="space-y-2">
              <Label className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Subject</Label>
              <Input
                required
                placeholder="e.g. New Drop — VAA Summer Collection"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Message Body</Label>
              <Textarea
                required
                rows={8}
                placeholder="Write your message here. Each line will become a paragraph."
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary min-h-[160px]"
              />
              <p className="font-sans text-[10px] text-muted-foreground">Each line break becomes a new paragraph in the email.</p>
            </div>
            <Button
              type="submit"
              disabled={sending || subscribers.length === 0}
              className="rounded-none font-display tracking-widest h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
            >
              {sending ? "SENDING..." : `SEND TO ${subscribers.length} SUBSCRIBER${subscribers.length !== 1 ? "S" : ""}`}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function PromoCodesTab({ token }: { token: string }) {
  const { toast } = useToast();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountAmount: "",
    minOrderValue: "",
    usageLimit: "",
    expiresAt: "",
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_ADMIN}/api/admin/promo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPromos(data.data ?? []);
    } catch {
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const resetForm = () => {
    setForm({ code: "", discountType: "percent", discountAmount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_ADMIN}/api/admin/promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountAmount: Number(form.discountAmount),
          minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create promo code");
      toast({ title: "Success", description: "Promo code created" });
      resetForm();
      fetchPromos();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (promo: any) => {
    try {
      const res = await fetch(`${BASE_ADMIN}/api/admin/promo/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, active: !p.active } : p));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      await fetch(`${BASE_ADMIN}/api/admin/promo/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Deleted", description: "Promo code removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl tracking-widest uppercase">Promo Codes</h2>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-none font-sans uppercase tracking-widest text-xs h-10 px-6 bg-foreground text-background hover:bg-primary hover:text-white transition-colors"
        >
          {showForm ? "Cancel" : "+ New Code"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-border bg-card p-6 space-y-4">
          <h3 className="font-display text-lg tracking-widest uppercase">Create Promo Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Code</Label>
              <Input
                required
                placeholder="e.g. SAVE10"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="rounded-none border-border font-mono uppercase tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Discount Type</Label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "percent" | "fixed" }))}
                className="w-full h-10 rounded-none border border-border bg-background text-foreground font-sans text-sm px-3"
              >
                <option value="percent">% Off</option>
                <option value="fixed">$ Off (Fixed)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Discount Amount {form.discountType === "percent" ? "(%)" : "($)"}
              </Label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder={form.discountType === "percent" ? "10" : "5.00"}
                value={form.discountAmount}
                onChange={(e) => setForm((p) => ({ ...p, discountAmount: e.target.value }))}
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Min Order Value ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional (e.g. 50.00)"
                value={form.minOrderValue}
                onChange={(e) => setForm((p) => ({ ...p, minOrderValue: e.target.value }))}
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Usage Limit</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Optional (e.g. 100)"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                className="rounded-none border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Expiry Date</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="rounded-none border-border"
              />
            </div>
          </div>
          <Button type="submit" className="rounded-none font-display tracking-widest h-12 px-8 bg-foreground text-background hover:bg-primary hover:text-white transition-colors">
            CREATE CODE
          </Button>
        </form>
      )}

      {loading ? (
        <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading...</div>
      ) : promos.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No promo codes yet
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((promo) => (
            <div key={promo.id} className="border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-lg tracking-widest font-bold">{promo.code}</span>
                  <span className={`font-sans text-[10px] tracking-widest border px-2 py-0.5 ${promo.active ? "border-green-700 text-green-400" : "border-border text-muted-foreground"}`}>
                    {promo.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="font-sans text-sm text-muted-foreground">
                  {promo.discountType === "percent" ? `${promo.discountAmount}% off` : `$${promo.discountAmount.toFixed(2)} off`}
                  {promo.minOrderValue ? ` · Min $${promo.minOrderValue.toFixed(2)}` : ""}
                  {promo.usageLimit ? ` · ${promo.usageCount}/${promo.usageLimit} used` : ` · ${promo.usageCount} used`}
                  {promo.expiresAt ? ` · Expires ${new Date(promo.expiresAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleActive(promo)}
                  className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-border"
                >
                  {promo.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(promo.id)}
                  className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-destructive text-destructive hover:bg-destructive hover:text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesTab({ token }: { token: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data.data ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to create category (HTTP ${res.status})`);
      toast({ title: "Category created", description: data.name ?? name });
      setNewName("");
      // Optimistic update — show the new category immediately
      if (data && data.id) {
        setCategories((prev) => {
          const next = [...prev.filter((c) => c.id !== data.id), data];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update category (HTTP ${res.status})`);
      toast({ title: "Category updated" });
      setEditingId(null);
      setEditName("");
      if (data && data.id) {
        setCategories((prev) =>
          prev.map((c) => (c.id === data.id ? data : c)).sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Existing products keep their category label.")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete category (HTTP ${res.status})`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category deleted" });
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-widest uppercase">Categories</h2>
        <Button variant="outline" onClick={fetchCategories} className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4">
          Refresh
        </Button>
      </div>

      <form onSubmit={handleCreate} className="border border-border bg-card p-6 space-y-4">
        <h3 className="font-display text-lg tracking-widest uppercase">New Category</h3>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Tees, Hoodies, Headwear"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            className="rounded-none font-display tracking-widest h-10 px-6 bg-foreground text-background hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
          >
            Add
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No categories yet
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-border bg-card p-4 flex items-center justify-between gap-3">
              {editingId === cat.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-none border-border h-9"
                  autoFocus
                />
              ) : (
                <div>
                  <p className="font-sans uppercase tracking-widest text-sm font-medium">{cat.name}</p>
                  <p className="font-sans text-[10px] text-muted-foreground tracking-wider">/{cat.slug}</p>
                </div>
              )}
              <div className="flex gap-2">
                {editingId === cat.id ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdate(cat.id)}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setEditingId(null); setEditName(""); }}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-border"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-border"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(cat.id)}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-destructive text-destructive hover:bg-destructive hover:text-white"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SizesTab({ token }: { token: string }) {
  const { toast } = useToast();
  const [sizes, setSizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sizes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSizes(data.data ?? []);
    } catch {
      setSizes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSizes(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    try {
      const res = await fetch("/api/admin/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to create size (HTTP ${res.status})`);
      toast({ title: "Size created", description: data.label ?? label });
      setNewLabel("");
      if (data && data.id) {
        setSizes((prev) => [...prev.filter((s) => s.id !== data.id), data]);
      }
      fetchSizes();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    const label = editLabel.trim();
    if (!label) return;
    try {
      const res = await fetch(`/api/admin/sizes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update size (HTTP ${res.status})`);
      toast({ title: "Size updated" });
      setEditingId(null);
      setEditLabel("");
      if (data && data.id) {
        setSizes((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      }
      fetchSizes();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this size? Existing products keep their selected sizes.")) return;
    try {
      const res = await fetch(`/api/admin/sizes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete size (HTTP ${res.status})`);
      setSizes((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Size deleted" });
      fetchSizes();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-widest uppercase">Sizes</h2>
        <Button variant="outline" onClick={fetchSizes} className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4">
          Refresh
        </Button>
      </div>

      <p className="font-sans text-xs text-muted-foreground tracking-wider">
        Sizes defined here appear as selectable options when creating or editing a product. If you add no sizes, the product form falls back to a default list (XS-XXL).
      </p>

      <form onSubmit={handleCreate} className="border border-border bg-card p-6 space-y-4">
        <h3 className="font-display text-lg tracking-widest uppercase">New Size</h3>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. S, M, L, 32, ONE SIZE"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary uppercase"
          />
          <Button
            type="submit"
            className="rounded-none font-display tracking-widest h-10 px-6 bg-foreground text-background hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
          >
            Add
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading...</div>
      ) : sizes.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center font-sans text-sm text-muted-foreground tracking-widest uppercase">
          No sizes yet
        </div>
      ) : (
        <div className="space-y-2">
          {sizes.map((s) => (
            <div key={s.id} className="border border-border bg-card p-4 flex items-center justify-between gap-3">
              {editingId === s.id ? (
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="rounded-none border-border h-9 uppercase"
                  autoFocus
                />
              ) : (
                <p className="font-sans uppercase tracking-widest text-sm font-medium" data-testid={`size-label-${s.id}`}>
                  {s.label}
                </p>
              )}
              <div className="flex gap-2">
                {editingId === s.id ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdate(s.id)}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setEditingId(null); setEditLabel(""); }}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-border"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setEditingId(s.id); setEditLabel(s.label); }}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-border"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(s.id)}
                      className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 border-destructive text-destructive hover:bg-destructive hover:text-white"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OverviewTab — sales summary & tax-prep helpers
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="font-sans text-sm text-muted-foreground tracking-widest uppercase">Loading overview...</div>;
  }

  // "Paid" orders = anything not pending. Pending orders haven't been paid yet.
  const paidOrders = orders.filter((o) => o.status !== "pending");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sumCents = (arr: any[]) => arr.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const sumDiscount = (arr: any[]) => arr.reduce((acc, o) => acc + (o.discountAmount ?? 0), 0);
  const inRange = (o: any, since: Date) => new Date(o.createdAt) >= since;

  const totalRevenue = sumCents(paidOrders);
  const monthRevenue = sumCents(paidOrders.filter((o) => inRange(o, startOfMonth)));
  const ytdRevenue = sumCents(paidOrders.filter((o) => inRange(o, startOfYear)));
  const last30Revenue = sumCents(paidOrders.filter((o) => inRange(o, start30)));
  const aov = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Status counts (all orders, not just paid)
  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  // Best sellers: aggregate items
  const itemCounts = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of paidOrders) {
    for (const item of o.items ?? []) {
      const key = item.productName ?? item.name ?? "Unknown";
      const cur = itemCounts.get(key) ?? { name: key, qty: 0, revenue: 0 };
      cur.qty += item.quantity ?? 1;
      cur.revenue += (item.price ?? 0) * (item.quantity ?? 1);
      itemCounts.set(key, cur);
    }
  }
  const bestSellers = Array.from(itemCounts.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Available years for tax year selector
  const years = Array.from(new Set(paidOrders.map((o) => new Date(o.createdAt).getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(taxYear)) years.unshift(taxYear);

  // Monthly breakdown for selected tax year
  const taxYearOrders = paidOrders.filter((o) => new Date(o.createdAt).getFullYear() === taxYear);
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const monthOrders = taxYearOrders.filter((o) => new Date(o.createdAt).getMonth() === i);
    return {
      month: new Date(taxYear, i, 1).toLocaleString("en-US", { month: "long" }),
      orders: monthOrders.length,
      gross: sumCents(monthOrders) + sumDiscount(monthOrders), // gross = total + discount
      discounts: sumDiscount(monthOrders),
      net: sumCents(monthOrders), // what was actually charged
    };
  });
  const yearTotals = monthlyBreakdown.reduce(
    (acc, m) => ({
      orders: acc.orders + m.orders,
      gross: acc.gross + m.gross,
      discounts: acc.discounts + m.discounts,
      net: acc.net + m.net,
    }),
    { orders: 0, gross: 0, discounts: 0, net: 0 },
  );

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const downloadCsv = () => {
    const header = ["Order Number", "Date", "Customer Name", "Customer Email", "Status", "Items", "Gross (USD)", "Discount (USD)", "Net Charged (USD)", "Promo Code"];
    const rows = taxYearOrders
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((o) => {
        const itemsStr = (o.items ?? [])
          .map((it: any) => `${it.quantity ?? 1}x ${it.productName ?? it.name ?? ""}${it.size ? " (" + it.size + ")" : ""}`)
          .join("; ");
        const discount = o.discountAmount ?? 0;
        const net = o.total ?? 0;
        const gross = net + discount;
        return [
          o.orderNumber ?? "",
          new Date(o.createdAt).toISOString().split("T")[0],
          o.customerName ?? "",
          o.customerEmail ?? "",
          o.status ?? "",
          itemsStr,
          (gross / 100).toFixed(2),
          (discount / 100).toFixed(2),
          (net / 100).toFixed(2),
          o.promoCode ?? "",
        ];
      });
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaa-sales-${taxYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="border border-border bg-card p-5">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">{label}</p>
      <p className="font-display text-2xl md:text-3xl tracking-wider text-foreground">{value}</p>
      {sub && <p className="font-sans text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Headline stats */}
      <div>
        <h2 className="font-display text-2xl tracking-widest uppercase mb-4">Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="This Month" value={fmt(monthRevenue)} sub={`${paidOrders.filter((o) => inRange(o, startOfMonth)).length} orders`} />
          <Stat label="Last 30 Days" value={fmt(last30Revenue)} sub={`${paidOrders.filter((o) => inRange(o, start30)).length} orders`} />
          <Stat label="Year to Date" value={fmt(ytdRevenue)} sub={`${paidOrders.filter((o) => inRange(o, startOfYear)).length} orders`} />
          <Stat label="All Time" value={fmt(totalRevenue)} sub={`${paidOrders.length} orders`} />
        </div>
      </div>

      {/* Order pipeline */}
      <div>
        <h2 className="font-display text-2xl tracking-widest uppercase mb-4">Order Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Pending" value={String(statusCounts.pending)} sub="Awaiting payment" />
          <Stat label="Processing" value={String(statusCounts.processing)} sub="Paid · needs ship" />
          <Stat label="Shipped" value={String(statusCounts.shipped)} sub="In transit" />
          <Stat label="Delivered" value={String(statusCounts.delivered)} sub="Completed" />
        </div>
        <p className="font-sans text-xs text-muted-foreground mt-3">
          Average order value: <span className="text-foreground font-semibold">{fmt(aov)}</span>
        </p>
      </div>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <div>
          <h2 className="font-display text-2xl tracking-widest uppercase mb-4">Best Sellers</h2>
          <div className="border border-border bg-card divide-y divide-border">
            {bestSellers.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-display text-xl text-primary w-6 flex-shrink-0">{i + 1}</span>
                  <p className="font-sans text-sm truncate">{b.name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-sans text-sm font-semibold">{b.qty} sold</p>
                  <p className="font-sans text-xs text-muted-foreground">{fmt(b.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax helper */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-display text-2xl tracking-widest uppercase">Tax Summary</h2>
          <div className="flex items-center gap-2">
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="bg-background border border-border rounded-none font-sans text-sm tracking-widest uppercase h-9 px-3"
              data-testid="select-tax-year"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button
              onClick={downloadCsv}
              className="rounded-none font-sans text-xs uppercase tracking-widest h-9 px-4 bg-foreground text-background hover:bg-primary hover:text-white"
              data-testid="button-export-csv"
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat label={`${taxYear} Orders`} value={String(yearTotals.orders)} />
          <Stat label={`${taxYear} Gross Sales`} value={fmt(yearTotals.gross)} sub="Before discounts" />
          <Stat label={`${taxYear} Discounts`} value={fmt(yearTotals.discounts)} sub="Promo codes applied" />
          <Stat label={`${taxYear} Net Revenue`} value={fmt(yearTotals.net)} sub="What you actually collected" />
        </div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="p-3 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Month</th>
                <th className="p-3 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-right">Orders</th>
                <th className="p-3 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-right">Gross</th>
                <th className="p-3 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-right">Discounts</th>
                <th className="p-3 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map((m) => (
                <tr key={m.month} className="border-b border-border last:border-0">
                  <td className="p-3 font-sans">{m.month}</td>
                  <td className="p-3 font-sans text-right">{m.orders}</td>
                  <td className="p-3 font-sans text-right">{fmt(m.gross)}</td>
                  <td className="p-3 font-sans text-right text-muted-foreground">{fmt(m.discounts)}</td>
                  <td className="p-3 font-sans text-right font-semibold">{fmt(m.net)}</td>
                </tr>
              ))}
              <tr className="bg-background/40">
                <td className="p-3 font-display tracking-widest uppercase text-sm">Total</td>
                <td className="p-3 font-sans text-right font-semibold">{yearTotals.orders}</td>
                <td className="p-3 font-sans text-right font-semibold">{fmt(yearTotals.gross)}</td>
                <td className="p-3 font-sans text-right font-semibold text-muted-foreground">{fmt(yearTotals.discounts)}</td>
                <td className="p-3 font-sans text-right font-semibold text-primary">{fmt(yearTotals.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 border border-border bg-card p-4 text-xs text-muted-foreground font-sans space-y-1.5 leading-relaxed">
          <p><span className="text-foreground font-semibold uppercase tracking-widest text-[10px]">Tax filing tip:</span> Use the <span className="text-foreground">Net Revenue</span> figure as your gross income. Excluded: pending (unpaid) orders.</p>
          <p>Stripe fees are not deducted here — pull those from your Stripe dashboard (Stripe → Reports → Balance) and subtract them as a business expense.</p>
          <p>Click <span className="text-foreground">Export CSV</span> to download every order for {taxYear} in a spreadsheet your accountant or tax software can import.</p>
        </div>
      </div>
    </div>
  );
}
