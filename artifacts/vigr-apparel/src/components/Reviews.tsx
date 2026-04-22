import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
}

interface Props {
  productId: string;
}

function StarRow({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-${size} h-${size} ${
            i <= value ? "text-primary fill-primary" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          aria-checked={value === i}
          role="radio"
          data-testid={`star-${i}`}
          className="p-1"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              i <= value ? "text-primary fill-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

export function Reviews({ productId }: Props) {
  const { isLoggedIn, token } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data ?? []);
        setAverage(typeof data.average === "number" ? data.average : null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 4) {
      toast({ title: "Too short", description: "Tell us a bit more.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to post review");
      }
      toast({ title: "Review posted", description: "Thanks for sharing." });
      setBody("");
      setRating(5);
      setShowForm(false);
      load();
    } catch (err: any) {
      toast({
        title: "Could not post review",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-border pt-10 mt-10" data-testid="section-reviews">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-2">
            Reviews
          </p>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl sm:text-3xl tracking-[0.15em] uppercase">
              {average !== null ? average.toFixed(1) : "No reviews yet"}
            </h2>
            {average !== null && (
              <>
                <StarRow value={Math.round(average)} size={5} />
                <span className="font-sans text-xs text-muted-foreground">
                  · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </>
            )}
          </div>
        </div>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            data-testid="button-toggle-review-form"
            className="self-start font-sans text-[10px] tracking-[0.3em] uppercase border border-border px-4 h-10 hover:border-foreground transition-colors"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        ) : (
          <Link
            href="/account/login"
            className="self-start font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in to write a review →
          </Link>
        )}
      </div>

      {showForm && isLoggedIn && (
        <form
          onSubmit={submit}
          className="border border-border p-4 sm:p-6 mb-8 space-y-4 bg-foreground/[0.02]"
        >
          <div>
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Your Rating
            </p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-2">
              Your Review
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              required
              data-testid="input-review-body"
              className="w-full bg-transparent border border-border p-3 font-sans text-sm focus:outline-none focus:border-foreground resize-y"
              placeholder="What did you think?"
            />
            <div className="font-sans text-[10px] text-muted-foreground/70 mt-1 text-right">
              {body.length}/2000
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            data-testid="button-submit-review"
            className="h-12 px-8 bg-foreground text-background font-display text-sm tracking-[0.25em] uppercase hover:bg-primary hover:text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Post Review
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center font-sans text-xs text-muted-foreground tracking-widest uppercase">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border">
          <p className="font-sans text-xs text-muted-foreground tracking-[0.2em] uppercase">
            Be the first to review this piece.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-border p-4 sm:p-5" data-testid={`review-${r.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-sans text-sm font-medium">{r.authorName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRow value={r.rating} />
                    <span className="font-sans text-[10px] text-muted-foreground tracking-wider uppercase">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="font-sans text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
