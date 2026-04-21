function sr(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function ThornsDivider({ flip = false }: { flip?: boolean }) {
  const W = 1440;
  const H = 90;

  const branches = [
    { y: 44, a: 8,  f: 0.0052, p: 0.0  },
    { y: 30, a: 6,  f: 0.0074, p: 1.8  },
    { y: 58, a: 7,  f: 0.0063, p: 0.9  },
    { y: 36, a: 5,  f: 0.0091, p: 2.5  },
    { y: 52, a: 4,  f: 0.0080, p: 3.3  },
    { y: 24, a: 4,  f: 0.0110, p: 0.4  },
  ];

  const getY = (b: (typeof branches)[0], x: number) =>
    b.y + Math.sin(x * b.f + b.p) * b.a;

  const buildPath = (b: (typeof branches)[0]) => {
    const pts: [number, number][] = [];
    for (let x = 0; x <= W; x += 24) {
      pts.push([x, getY(b, x)]);
    }
    return pts.reduce((d, [x, y], i) => {
      if (i === 0) return `M${x},${y.toFixed(1)}`;
      const [px, py] = pts[i - 1];
      const mx = ((px + x) / 2).toFixed(1);
      return d + ` Q${mx},${py.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, "");
  };

  const paths = branches.map(buildPath);

  const thorns: {
    x1: number; y1: number; x2: number; y2: number;
    w: number; op: number;
  }[] = [];

  let si = 0;
  for (let x = 1; x < W; ) {
    const step = 3 + Math.floor(sr(si++) * 8);
    x += step;
    const bi = Math.floor(sr(si++) * branches.length);
    const b = branches[bi];
    const y = getY(b, x);

    const angle = (sr(si++) - 0.5) * 170;
    const len = 6 + sr(si++) * 20;
    const rad = (angle * Math.PI) / 180;
    const x2 = x + Math.sin(rad) * len;
    const y2 = y - Math.cos(rad) * len;
    const op = 0.55 + sr(si++) * 0.4;
    const w = 0.6 + sr(si++) * 0.7;
    thorns.push({ x1: x, y1: y, x2, y2, op, w });

    if (sr(si++) > 0.65) {
      const angle2 = angle + (sr(si++) - 0.5) * 60;
      const len2 = 3 + sr(si++) * 9;
      const rad2 = (angle2 * Math.PI) / 180;
      thorns.push({
        x1: x2,
        y1: y2,
        x2: x2 + Math.sin(rad2) * len2,
        y2: y2 - Math.cos(rad2) * len2,
        op: op * 0.7,
        w: w * 0.6,
      });
    }
  }

  const branchWidths  = [1.6, 1.2, 1.1, 0.9, 0.8, 0.7];
  const branchOpacity = [0.70, 0.60, 0.55, 0.45, 0.40, 0.35];

  return (
    <div
      className="w-full overflow-hidden"
      style={{ transform: flip ? "scaleY(-1)" : undefined, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: "72px", display: "block" }}
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth={branchWidths[i]}
            fill="none"
            opacity={branchOpacity[i]}
          />
        ))}
        {thorns.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeWidth={t.w}
            strokeLinecap="round"
            opacity={t.op}
          />
        ))}
      </svg>
    </div>
  );
}
