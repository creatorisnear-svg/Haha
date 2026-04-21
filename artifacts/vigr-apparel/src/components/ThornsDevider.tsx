export default function ThornsDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="w-full overflow-hidden leading-none"
      style={{ transform: flip ? "scaleY(-1)" : undefined, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 60"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: "48px", display: "block" }}
      >
        <path
          d="M0,30 Q60,28 120,30 Q180,32 240,30 Q300,28 360,30 Q420,32 480,30 Q540,28 600,30 Q660,32 720,30 Q780,28 840,30 Q900,32 960,30 Q1020,28 1080,30 Q1140,32 1200,30"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.55"
        />
        {[40, 90, 145, 200, 255, 310, 365, 420, 475, 530, 585, 640, 695, 750, 805, 860, 915, 970, 1025, 1080, 1135, 1165].map(
          (x, i) => {
            const up = i % 3 !== 1;
            const len = 10 + (i % 4) * 4;
            const angle = up
              ? -55 + (i % 5) * 8
              : 55 - (i % 5) * 8;
            const rad = (angle * Math.PI) / 180;
            const x2 = x + len * Math.sin(rad);
            const y2 = 30 - len * Math.cos(rad) * (up ? 1 : -1);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={30}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  opacity="0.6"
                  strokeLinecap="round"
                />
                <circle cx={x2} cy={y2} r="1.2" fill="currentColor" opacity="0.5" />
              </g>
            );
          }
        )}
        <path
          d="M0,33 Q80,31 160,33 Q240,35 320,33 Q400,31 480,33 Q560,35 640,33 Q720,31 800,33 Q880,35 960,33 Q1040,31 1120,33 Q1160,34 1200,33"
          stroke="currentColor"
          strokeWidth="0.7"
          fill="none"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}
