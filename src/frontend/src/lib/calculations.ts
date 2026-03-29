export interface BeamInputData {
  designation: string;
  Mu: number;
  fck: number;
  fy: number;
  b: number;
  D: number;
  d: number;
  Vu: number;
}

export interface BarCombo {
  n: number;
  dia: number;
  area: number;
}

export interface CalculationResult {
  b_new: number;
  D_new: number;
  cover: number;
  d_new: number;
  Mlim: number;
  isDoubly: boolean;
  Ast_req: number; // displayed as integer (Math.floor)
  Ast_min: number; // displayed as integer (Math.ceil)
  selectedBar: BarCombo;
  Ast_adopted: number; // design value with 3% provision
  Xu: number;
  Xu_max: number;
  Mu_actual: number;
  bendingSafe: boolean;
  Pt: number;
  Tc: number;
  Vc: number;
  shearSafe: boolean;
}

const BAR_COMBOS: BarCombo[] = [
  { n: 2, dia: 10, area: 157 },
  { n: 2, dia: 12, area: 226 },
  { n: 3, dia: 10, area: 236 },
  { n: 3, dia: 12, area: 339 },
  { n: 4, dia: 10, area: 314 },
  { n: 4, dia: 12, area: 452 },
  { n: 2, dia: 16, area: 402 },
  { n: 3, dia: 16, area: 603 },
  { n: 2, dia: 20, area: 628 },
  { n: 4, dia: 16, area: 804 },
  { n: 3, dia: 20, area: 942 },
  { n: 2, dia: 25, area: 982 },
  { n: 4, dia: 20, area: 1256 },
  { n: 3, dia: 25, area: 1473 },
  { n: 4, dia: 25, area: 1964 },
];

// IS 456:2000 Table 19 — Design shear strength of concrete Tc (N/mm²)
export const TABLE_19_FULL = [
  { pt: 0.15, m15: 0.28, m20: 0.28, m25: 0.29, m30: 0.29, m35: 0.29, m40: 0.3 },
  {
    pt: 0.25,
    m15: 0.35,
    m20: 0.36,
    m25: 0.36,
    m30: 0.37,
    m35: 0.37,
    m40: 0.38,
  },
  { pt: 0.5, m15: 0.46, m20: 0.48, m25: 0.49, m30: 0.5, m35: 0.5, m40: 0.51 },
  { pt: 0.75, m15: 0.54, m20: 0.56, m25: 0.57, m30: 0.59, m35: 0.59, m40: 0.6 },
  { pt: 1.0, m15: 0.6, m20: 0.62, m25: 0.64, m30: 0.66, m35: 0.67, m40: 0.68 },
  { pt: 1.25, m15: 0.64, m20: 0.67, m25: 0.7, m30: 0.71, m35: 0.73, m40: 0.74 },
  { pt: 1.5, m15: 0.68, m20: 0.72, m25: 0.74, m30: 0.76, m35: 0.78, m40: 0.79 },
  { pt: 1.75, m15: 0.71, m20: 0.75, m25: 0.78, m30: 0.8, m35: 0.82, m40: 0.84 },
  { pt: 2.0, m15: 0.71, m20: 0.79, m25: 0.82, m30: 0.84, m35: 0.85, m40: 0.88 },
  { pt: 2.25, m15: 0.71, m20: 0.81, m25: 0.85, m30: 0.88, m35: 0.9, m40: 0.92 },
  { pt: 2.5, m15: 0.71, m20: 0.82, m25: 0.88, m30: 0.91, m35: 0.93, m40: 0.95 },
  { pt: 2.75, m15: 0.71, m20: 0.82, m25: 0.9, m30: 0.94, m35: 0.96, m40: 0.98 },
  { pt: 3.0, m15: 0.71, m20: 0.82, m25: 0.92, m30: 0.96, m35: 0.99, m40: 1.01 },
];

/**
 * Select the correct Tc column from IS 456 Table 19 based on fck.
 */
function getTcColumn(fck: number): keyof (typeof TABLE_19_FULL)[0] {
  if (fck <= 15) return "m15";
  if (fck <= 20) return "m20";
  if (fck <= 25) return "m25";
  if (fck <= 30) return "m30";
  if (fck <= 35) return "m35";
  return "m40";
}

/**
 * Interpolate Tc from IS 456 Table 19 for given Pt and fck.
 */
export function interpolateTc(Pt: number, fck: number): number {
  const col = getTcColumn(fck);
  const t = TABLE_19_FULL;
  if (Pt <= t[0].pt) return t[0][col] as number;
  if (Pt >= t[t.length - 1].pt) return t[t.length - 1][col] as number;
  for (let i = 0; i < t.length - 1; i++) {
    if (Pt >= t[i].pt && Pt <= t[i + 1].pt) {
      const tc_lower = t[i][col] as number;
      const tc_upper = t[i + 1][col] as number;
      return (
        tc_lower +
        ((Pt - t[i].pt) / (t[i + 1].pt - t[i].pt)) * (tc_upper - tc_lower)
      );
    }
  }
  return t[t.length - 1][col] as number;
}

/**
 * Main calculation function — IS 456:2000 Limit State Method
 * Beam Jacketing Design as per IS 15988-2013
 */
export function calculate(input: BeamInputData): CalculationResult {
  const { Mu, fck, fy, b, D, Vu } = input;

  // ── Section enlargement (IS 15988-2013)
  const b_new = b + 200;
  const D_new = D + 100;
  const cover = 40;
  const d_new = D_new - cover;

  // ── Limiting moment capacity (IS 456 Cl. G-1.1 exact formula)
  const Xu_max = 0.48 * d_new;
  const Mlim = (0.36 * fck * b_new * Xu_max * (d_new - 0.42 * Xu_max)) / 1e6;

  const isDoubly = Mu > Mlim;

  // ── Required tension steel (lever-arm ≈ 0.9d)
  const Ast_req_raw = (Mu * 1e6) / (0.87 * fy * 0.9 * d_new);
  const Ast_req = Math.floor(Ast_req_raw);

  // ── Minimum steel (IS 456 Cl. 26.5.1.1)
  const Ast_min_raw = (0.85 * b_new * d_new) / fy;
  const Ast_min = Math.ceil(Ast_min_raw);

  // ── Design steel needed
  const Ast_needed_raw = Math.max(Ast_req_raw, Ast_min_raw);
  const Ast_needed_ceil = Math.ceil(Ast_needed_raw);

  // ── Adopted steel: 3% design provision
  const Ast_adopted = Math.round(Ast_needed_ceil * 1.03);

  // ── Bar selection: prefer standard 16mm+ bars (practical Indian detailing)
  //    First try combos with dia >= 16mm sorted by area ascending.
  //    Fall back to any combo if none found.
  const preferred = BAR_COMBOS.filter((c) => c.dia >= 16)
    .slice()
    .sort((a, b) => a.area - b.area)
    .find((c) => c.area >= Ast_needed_ceil);
  const selectedBar =
    preferred ??
    BAR_COMBOS.slice()
      .sort((a, b) => a.area - b.area)
      .find((c) => c.area >= Ast_needed_ceil) ??
    BAR_COMBOS[BAR_COMBOS.length - 1];

  // ── Neutral axis depth
  const Xu = (0.87 * fy * Ast_adopted) / (0.36 * fck * b_new);

  // ── Actual moment of resistance
  const Mu_actual = (0.87 * fy * Ast_adopted * (d_new - 0.42 * Xu)) / 1e6;

  const bendingSafe = Mu_actual >= Mu;

  // ── Shear design (IS 456 Cl. 40.2 & Table 19)
  const Pt = (100 * Ast_adopted) / (b_new * d_new);
  const Tc_interpolated = interpolateTc(Pt, fck);
  const Tc = Math.round(Tc_interpolated * 1000) / 1000;
  const Vc = (Tc * b_new * d_new) / 1000;

  const shearSafe = Vc >= Vu;

  return {
    b_new,
    D_new,
    cover,
    d_new,
    Mlim,
    isDoubly,
    Ast_req,
    Ast_min,
    selectedBar,
    Ast_adopted,
    Xu,
    Xu_max,
    Mu_actual,
    bendingSafe,
    Pt,
    Tc,
    Vc,
    shearSafe,
  };
}
