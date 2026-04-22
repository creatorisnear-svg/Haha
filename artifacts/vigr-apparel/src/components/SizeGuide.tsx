import { useState } from "react";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Unit = "in" | "cm";

const SIZE_CHART: { size: string; chest: number; waist: number; length: number }[] = [
  { size: "XS", chest: 34, waist: 28, length: 27 },
  { size: "S", chest: 36, waist: 30, length: 28 },
  { size: "M", chest: 40, waist: 32, length: 29 },
  { size: "L", chest: 44, waist: 34, length: 30 },
  { size: "XL", chest: 48, waist: 36, length: 31 },
  { size: "XXL", chest: 52, waist: 40, length: 32 },
];

const toCm = (inches: number) => Math.round(inches * 2.54);

export function SizeGuide() {
  const [unit, setUnit] = useState<Unit>("in");
  const fmt = (val: number) => (unit === "in" ? `${val}"` : `${toCm(val)}`);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="button-open-size-guide"
          className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <Ruler className="w-3.5 h-3.5" />
          Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full bg-background border border-border rounded-none p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <DialogTitle className="font-display text-xl tracking-[0.2em] uppercase">
            Size Guide
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground mt-2 leading-relaxed">
            Measurements taken flat across the garment. For best fit, compare to a tee you already own.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex items-center justify-between">
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
            Tees & Tops
          </p>
          <div className="inline-flex border border-border" role="group" aria-label="Units">
            <button
              type="button"
              onClick={() => setUnit("in")}
              data-testid="button-unit-in"
              className={`h-8 w-12 font-sans text-[10px] tracking-[0.3em] uppercase transition-colors ${
                unit === "in"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              IN
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              data-testid="button-unit-cm"
              className={`h-8 w-12 font-sans text-[10px] tracking-[0.3em] uppercase border-l border-border transition-colors ${
                unit === "cm"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              CM
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full font-sans text-xs border border-border">
            <thead>
              <tr className="bg-foreground/5">
                <th className="text-left px-3 py-3 font-semibold tracking-[0.2em] uppercase text-[10px]">Size</th>
                <th className="text-right px-3 py-3 font-semibold tracking-[0.2em] uppercase text-[10px]">Chest</th>
                <th className="text-right px-3 py-3 font-semibold tracking-[0.2em] uppercase text-[10px]">Waist</th>
                <th className="text-right px-3 py-3 font-semibold tracking-[0.2em] uppercase text-[10px]">Length</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((row) => (
                <tr key={row.size} className="border-t border-border">
                  <td className="px-3 py-3 font-display tracking-[0.15em]">{row.size}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{fmt(row.chest)}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{fmt(row.waist)}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{fmt(row.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-sans text-[10px] text-muted-foreground/70 leading-relaxed mt-4">
            Between sizes? Most pieces have a relaxed fit. Size down for a fitted look, up for oversized.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
