import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useListProducts } from "@workspace/api-client-react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useJsonLd } from "@/lib/use-json-ld";

interface Category { id: string; name: string; slug: string; }

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: productsData, isLoading } = useListProducts();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const category = categories.find((c) => c.slug === slug);
  const categoryName = category?.name ?? slug.replace(/-/g, " ");

  const allProducts = productsData?.data ?? [];
  const inCategory = allProducts.filter(
    (p: any) => (p.category ?? "").toLowerCase() === categoryName.toLowerCase(),
  );
  const displayed = inCategory;

  useJsonLd("breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vaaclothing.xyz/" },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `https://vaaclothing.xyz/category/${slug}`,
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header categories={categories} />

      <section className="pt-[100px] sm:pt-[112px] pb-16 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="link-back-home"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className="mb-8 sm:mb-12 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-3">Category</p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,5rem)] tracking-[0.15em] uppercase">
            {categoryName}
          </h1>
        </div>

        {/* Other categories quick links */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`font-sans text-[10px] sm:text-[11px] tracking-[0.25em] uppercase border px-4 py-2 transition-all ${
                  cat.slug === slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground hover:bg-foreground hover:text-background"
                }`}
                data-testid={`pill-category-${cat.slug}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64 font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Loading...
          </div>
        ) : !displayed.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
              No products in this category yet.
            </p>
            <Link
              href="/"
              className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayed.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
