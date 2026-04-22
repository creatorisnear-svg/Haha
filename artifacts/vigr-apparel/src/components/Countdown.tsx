import { useEffect, useState } from "react";

interface Props {
  releaseDate: string | Date;
  variant?: "card" | "detail";
  onLive?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function diff(target: Date): TimeLeft {
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

export function Countdown({ releaseDate, variant = "detail", onLive }: Props) {
  const target = new Date(releaseDate);
  const [t, setT] = useState<TimeLeft>(() => diff(target));
  const live = t.totalMs <= 0;

  useEffect(() => {
    if (live) return;
    const id = setInterval(() => {
      const next = diff(target);
      setT(next);
      if (next.totalMs <= 0) {
        clearInterval(id);
        onLive?.();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseDate]);

  if (live) return null;

  if (variant === "card") {
    const label =
      t.days > 0
        ? `${t.days}d ${t.hours}h`
        : t.hours > 0
          ? `${t.hours}h ${t.minutes}m`
          : `${t.minutes}m ${t.seconds}s`;
    return (
      <span
        className="inline-flex items-center gap-1.5 font-sans text-[9px] tracking-[0.3em] uppercase text-foreground bg-foreground/10 backdrop-blur-[2px] border border-foreground/30 px-2 py-1"
        data-testid="badge-countdown"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Drops in {label}
      </span>
    );
  }

  const cells: { label: string; value: number }[] = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Min", value: t.minutes },
    { label: "Sec", value: t.seconds },
  ];

  return (
    <div
      className="border border-border bg-foreground/[0.03] px-4 py-4 sm:px-5 sm:py-5"
      data-testid="countdown-detail"
    >
      <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Drops In
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {cells.map((c) => (
          <div key={c.label} className="text-center">
            <div className="font-display text-2xl sm:text-3xl tracking-[0.05em] tabular-nums">
              {String(c.value).padStart(2, "0")}
            </div>
            <div className="font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground mt-1">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
