interface BarInfo {
  n: number;
  dia: number;
}

interface BeamSectionProps {
  b: number;
  D: number;
  d?: number;
  cover?: number;
  bars?: BarInfo | null;
  label: string;
  isNew?: boolean;
}

function computeBarPositions(
  n: number,
  sw: number,
  cover: number,
  scale: number,
  bx: number,
): number[] {
  const spacing = n === 1 ? 0 : (sw - 2 * cover * scale) / (n - 1);
  return Array.from({ length: n }, (_, i) => bx + cover * scale + i * spacing);
}

export function BeamSectionSVG({
  b,
  D,
  d,
  cover = 40,
  bars,
  label,
  isNew = false,
}: BeamSectionProps) {
  const maxW = 200;
  const maxH = 240;
  const scale = Math.min(maxW / b, maxH / D);
  const sw = b * scale;
  const sh = D * scale;
  const svgW = sw + 80;
  const svgH = sh + 90;
  const bx = 42;
  const by = 28;
  const barR = bars ? Math.max(bars.dia * scale * 0.55, 5) : 0;
  const barY = by + sh - cover * scale - barR;
  const patId = `hatch-${label.replace(/\s/g, "-")}`;
  const barPositions = bars
    ? computeBarPositions(bars.n, sw, cover, scale, bx)
    : [];

  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${isNew ? "text-primary" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="overflow-visible"
        role="img"
        aria-label={`${label} beam cross-section: ${b} x ${D} mm`}
      >
        <defs>
          <pattern
            id={patId}
            patternUnits="userSpaceOnUse"
            width="12"
            height="12"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="12"
              stroke="#BBBBBB"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect
          x={bx}
          y={by}
          width={sw}
          height={sh}
          fill={isNew ? "#EBF3FB" : "#F3F3F3"}
          stroke="#1E2A35"
          strokeWidth="2"
        />
        <rect
          x={bx}
          y={by}
          width={sw}
          height={sh}
          fill={`url(#${patId})`}
          opacity={0.5}
        />
        <rect
          x={bx + 8}
          y={by + 8}
          width={sw - 16}
          height={sh - 16}
          fill="none"
          stroke="#777"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {bars &&
          barPositions.map((cx) => (
            <g key={`bar-pos-${Math.round(cx)}`}>
              <circle
                cx={cx}
                cy={barY}
                r={barR}
                fill="#CC3333"
                stroke="#880000"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={barY - barR - 2}
                textAnchor="middle"
                fontSize="7"
                fill="#880000"
                fontWeight="bold"
              >
                Φ{bars.dia}
              </text>
            </g>
          ))}

        {bars && (
          <text
            x={bx + sw / 2}
            y={barY + barR + 13}
            textAnchor="middle"
            fontSize="10"
            fill="#CC3333"
            fontWeight="bold"
          >
            {bars.n}-Φ{bars.dia}mm
          </text>
        )}

        {!bars && (
          <text
            x={bx + sw / 2}
            y={by + sh / 2 + 4}
            textAnchor="middle"
            fontSize="9"
            fill="#999"
          >
            No Steel (Corroded)
          </text>
        )}

        {d && bars && (
          <>
            <line
              x1={bx + sw + 8}
              y1={by}
              x2={bx + sw + 8}
              y2={by + d * scale}
              stroke="#1F6FA8"
              strokeWidth="1"
            />
            <line
              x1={bx + sw + 4}
              y1={by}
              x2={bx + sw + 12}
              y2={by}
              stroke="#1F6FA8"
              strokeWidth="1"
            />
            <line
              x1={bx + sw + 4}
              y1={by + d * scale}
              x2={bx + sw + 12}
              y2={by + d * scale}
              stroke="#1F6FA8"
              strokeWidth="1"
            />
            <text
              x={bx + sw + 14}
              y={by + (d * scale) / 2 + 4}
              fontSize="8"
              fill="#1F6FA8"
            >
              d={d}mm
            </text>
          </>
        )}

        <line
          x1={bx}
          y1={by + sh + 16}
          x2={bx + sw}
          y2={by + sh + 16}
          stroke="#333"
          strokeWidth="1"
        />
        <line
          x1={bx}
          y1={by + sh + 11}
          x2={bx}
          y2={by + sh + 21}
          stroke="#333"
          strokeWidth="1"
        />
        <line
          x1={bx + sw}
          y1={by + sh + 11}
          x2={bx + sw}
          y2={by + sh + 21}
          stroke="#333"
          strokeWidth="1"
        />
        <text
          x={bx + sw / 2}
          y={by + sh + 30}
          textAnchor="middle"
          fontSize="10"
          fill="#333"
          fontWeight="bold"
        >
          {b} mm
        </text>

        <line
          x1={bx - 16}
          y1={by}
          x2={bx - 16}
          y2={by + sh}
          stroke="#333"
          strokeWidth="1"
        />
        <line
          x1={bx - 21}
          y1={by}
          x2={bx - 11}
          y2={by}
          stroke="#333"
          strokeWidth="1"
        />
        <line
          x1={bx - 21}
          y1={by + sh}
          x2={bx - 11}
          y2={by + sh}
          stroke="#333"
          strokeWidth="1"
        />
        <text
          x={bx - 26}
          y={by + sh / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#333"
          fontWeight="bold"
          transform={`rotate(-90, ${bx - 26}, ${by + sh / 2})`}
        >
          {D} mm
        </text>

        <rect
          x={bx}
          y={by + sh + 42}
          width={sw}
          height={18}
          fill={isNew ? "#1F6FA8" : "#666"}
          rx="2"
        />
        <text
          x={bx + sw / 2}
          y={by + sh + 55}
          textAnchor="middle"
          fontSize="10"
          fill="white"
          fontWeight="bold"
        >
          {b} × {D} mm
        </text>
      </svg>
    </div>
  );
}
