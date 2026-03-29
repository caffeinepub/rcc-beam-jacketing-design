import type { BeamInputData, CalculationResult } from "./calculations";
import { TABLE_19_FULL } from "./calculations";

export function exportToPDF(inp: BeamInputData, res: CalculationResult): void {
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const safe = (ok: boolean) =>
    ok
      ? `<span style="background:#2EAD66;color:#fff;padding:1px 8px;border-radius:3px;font-weight:bold">SAFE ✓</span>`
      : `<span style="background:#E53E3E;color:#fff;padding:1px 8px;border-radius:3px;font-weight:bold">UNSAFE ✗</span>`;

  const tRows = TABLE_19_FULL.map(
    (r) =>
      `<tr><td>${r.pt.toFixed(2)}</td><td style="background:#FFF9C4">${r.m15}</td><td>${r.m20}</td><td>${r.m25}</td><td>${r.m30}</td><td>${r.m35}</td><td>${r.m40}</td></tr>`,
  ).join("");

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>RCC Beam Jacketing Design Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;color:#1E2A35;line-height:1.5}
.page{max-width:210mm;margin:0 auto;padding:12mm 14mm}
h1{font-size:20pt;color:#1F6FA8}
h2{font-size:13pt;color:#1F6FA8;margin:18px 0 6px;border-bottom:2px solid #1F6FA8;padding-bottom:3px}
h3{font-size:11pt;color:#1E2A35;margin:12px 0 5px}
.tb{border-left:4px solid #1F6FA8;padding:10px 14px;background:#EBF3FB;margin-bottom:16px}
.meta{color:#555;font-size:10pt;margin-top:5px}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10pt}
th{background:#1F6FA8;color:#fff;padding:5px 9px;text-align:left}
td{padding:4px 9px;border-bottom:1px solid #DDE3EA}
tr:nth-child(even) td{background:#F5F8FC}
.fb{background:#F5F8FC;border-left:3px solid #1F6FA8;padding:7px 11px;margin:5px 0;font-family:'Courier New',monospace;font-size:10pt;color:#333}
.pb{page-break-before:always}
.ft{margin-top:28px;text-align:center;color:#999;font-size:9pt;border-top:1px solid #DDE;padding-top:8px}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0}
.sc{border:1px solid #DDE3EA;border-radius:5px;padding:10px;background:#FAFCFE}
.sc h4{color:#1F6FA8;font-size:11pt;margin-bottom:6px;border-bottom:1px solid #DDE3EA;padding-bottom:3px}
.rr{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #EEE}
.rl{color:#555}.rv{font-weight:bold}
@media print{body{margin:0}.page{padding:8mm;max-width:100%}}
</style></head><body><div class="page">
<div class="tb"><h1>RCC Beam Jacketing Design Report</h1>
<div class="meta"><strong>Element:</strong> ${inp.designation} &nbsp;|&nbsp; <strong>Standard:</strong> IS 456:2000 &nbsp;|&nbsp; <strong>Date:</strong> ${date}</div></div>

<h2>1. Input Data</h2>
<table><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
<tr><td>Structural Element Designation</td><td>${inp.designation}</td><td>—</td></tr>
<tr><td>Factored Moment (Mu)</td><td>${inp.Mu}</td><td>kNm</td></tr>
<tr><td>Grade of Concrete by NDT (fck)</td><td>${inp.fck}</td><td>N/mm²</td></tr>
<tr><td>Grade of Steel (fy)</td><td>${inp.fy}</td><td>N/mm²</td></tr>
<tr><td>Original Width (b)</td><td>${inp.b}</td><td>mm</td></tr>
<tr><td>Original Overall Depth (D)</td><td>${inp.D}</td><td>mm</td></tr>
<tr><td>Original Effective Depth (d)</td><td>${inp.d}</td><td>mm</td></tr>
<tr><td>Factored Shear Force (Vu)</td><td>${inp.Vu}</td><td>kN</td></tr>
</table>

<h2>2. Jacketed Section Details</h2>
<table><tr><th>Parameter</th><th>Formula</th><th>Value</th><th>Unit</th></tr>
<tr><td>New Width (b_new)</td><td>b + 200</td><td>${res.b_new}</td><td>mm</td></tr>
<tr><td>New Overall Depth (D_new)</td><td>D + 100</td><td>${res.D_new}</td><td>mm</td></tr>
<tr><td>Effective Cover</td><td>Assumed</td><td>${res.cover}</td><td>mm</td></tr>
<tr><td>New Effective Depth (d_new)</td><td>D_new − cover</td><td>${res.d_new}</td><td>mm</td></tr>
</table>

<div class="pb"></div>
<h2>3. Flexural Design (IS 456:2000)</h2>
<h3>Step 1: Limiting Moment Capacity</h3>
<div class="fb">Mlim = 0.138 × fck × b_new × d_new²<br>
Mlim = 0.138 × ${inp.fck} × ${res.b_new} × ${res.d_new}²<br>
Mlim = <strong>${res.Mlim.toFixed(2)} kNm</strong></div>
<p>Mu = ${inp.Mu} kNm, Mlim = ${res.Mlim.toFixed(2)} kNm → Beam is <strong>${res.isDoubly ? "Doubly Reinforced" : "Singly Reinforced"}</strong></p>

<h3>Step 2: Required Ast</h3>
<div class="fb">Ast_req = (Mu × 10⁶) / (0.87 × fy × 0.9 × d_new)<br>
= (${inp.Mu} × 10⁶) / (0.87 × ${inp.fy} × 0.9 × ${res.d_new})<br>
= <strong>${res.Ast_req.toFixed(2)} mm²</strong></div>

<h3>Step 3: Minimum Steel (IS 456 Cl. 26.5.1.1)</h3>
<div class="fb">Ast_min = (0.85 × b_new × d_new) / fy = (0.85 × ${res.b_new} × ${res.d_new}) / ${inp.fy}<br>
= <strong>${res.Ast_min.toFixed(2)} mm²</strong><br>
Governing Ast = max(${res.Ast_req.toFixed(0)}, ${res.Ast_min.toFixed(0)}) = ${Math.max(res.Ast_req, res.Ast_min).toFixed(2)} mm²</div>

<h3>Step 4: Bar Selection</h3>
<table><tr><th>Combination</th><th>Dia (mm)</th><th>No.</th><th>Area (mm²)</th></tr>
<tr><td>2 - 12 mm</td><td>12</td><td>2</td><td>226</td></tr>
<tr><td>2 - 16 mm</td><td>16</td><td>2</td><td>402</td></tr>
<tr><td>3 - 16 mm</td><td>16</td><td>3</td><td>603</td></tr>
<tr><td>2 - 20 mm</td><td>20</td><td>2</td><td>628</td></tr>
<tr style="background:#E8F5E9"><td><strong>SELECTED: ${res.selectedBar.n}-Φ${res.selectedBar.dia}mm</strong></td><td>${res.selectedBar.dia}</td><td>${res.selectedBar.n}</td><td><strong>${res.selectedBar.area}</strong></td></tr>
</table>

<h3>Step 5: Neutral Axis</h3>
<div class="fb">Xu = (0.87 × fy × Ast) / (0.36 × fck × b_new)<br>
= (0.87 × ${inp.fy} × ${res.Ast_adopted}) / (0.36 × ${inp.fck} × ${res.b_new}) = <strong>${res.Xu.toFixed(2)} mm</strong><br>
Xu_max = 0.48 × ${res.d_new} = ${res.Xu_max.toFixed(2)} mm → ${res.Xu <= res.Xu_max ? "Under-reinforced (OK)" : "EXCEEDS LIMIT"}</div>

<h3>Step 6: Actual Moment of Resistance</h3>
<div class="fb">Mu_actual = 0.87 × fy × Ast × (d_new − 0.42 × Xu) / 10⁶<br>
= 0.87 × ${inp.fy} × ${res.Ast_adopted} × (${res.d_new} − 0.42 × ${res.Xu.toFixed(2)}) / 10⁶<br>
= <strong>${res.Mu_actual.toFixed(2)} kNm</strong></div>
<p>Mu_actual (${res.Mu_actual.toFixed(2)}) ${res.bendingSafe ? ">" : "<"} Mu (${inp.Mu}) → ${safe(res.bendingSafe)}</p>

<div class="pb"></div>
<h2>4. Shear Design (IS 456:2000)</h2>
<h3>Step 1: Percentage Steel</h3>
<div class="fb">Pt = (100 × Ast) / (b_new × d_new) = (100 × ${res.Ast_adopted}) / (${res.b_new} × ${res.d_new})<br>
= <strong>${res.Pt.toFixed(3)} %</strong></div>

<h3>Step 2: IS 456 Table 19 — Permissible Shear Stress (N/mm²)</h3>
<table><tr><th>Pt (%)</th><th style="background:#F9A825;color:#1E2A35">M15*</th><th>M20</th><th>M25</th><th>M30</th><th>M35</th><th>M40+</th></tr>${tRows}</table>
<p style="font-size:9pt;color:#666">* M15 column used for fck = ${inp.fck} N/mm²</p>

<h3>Step 3: Interpolation</h3>
<div class="fb">Formula: Tc = T1 + [(Pt − P1) / (P2 − P1)] × (T2 − T1)<br>
For Pt = ${res.Pt.toFixed(3)} % → Tc = <strong>${res.Tc.toFixed(3)} N/mm²</strong></div>

<h3>Step 4: Shear Capacity</h3>
<div class="fb">Vc = Tc × b_new × d_new / 1000 = ${res.Tc.toFixed(3)} × ${res.b_new} × ${res.d_new} / 1000<br>
= <strong>${res.Vc.toFixed(2)} kN</strong></div>
<p>Vc (${res.Vc.toFixed(2)}) ${res.shearSafe ? ">" : "<"} Vu (${inp.Vu}) → ${safe(res.shearSafe)}</p>

<h2>5. Results Summary</h2>
<div class="sg">
<div class="sc"><h4>Existing Section</h4>
<div class="rr"><span class="rl">Designation</span><span class="rv">${inp.designation}</span></div>
<div class="rr"><span class="rl">b × D</span><span class="rv">${inp.b} × ${inp.D} mm</span></div>
<div class="rr"><span class="rl">Reinforcement</span><span class="rv">NIL (corroded)</span></div>
</div>
<div class="sc"><h4>Jacketed Section</h4>
<div class="rr"><span class="rl">b × D</span><span class="rv">${res.b_new} × ${res.D_new} mm</span></div>
<div class="rr"><span class="rl">Effective Depth</span><span class="rv">${res.d_new} mm</span></div>
<div class="rr"><span class="rl">Bars</span><span class="rv">${res.selectedBar.n}-Φ${res.selectedBar.dia}mm</span></div>
<div class="rr"><span class="rl">Ast Adopted</span><span class="rv">${res.Ast_adopted} mm²</span></div>
</div>
</div>
<table><tr><th>Check</th><th>Comparison</th><th>Status</th></tr>
<tr><td>Bending</td><td>Mu_actual=${res.Mu_actual.toFixed(2)} kNm ${res.bendingSafe ? ">" : "<"} Mu=${inp.Mu} kNm</td><td>${safe(res.bendingSafe)}</td></tr>
<tr><td>Shear</td><td>Vc=${res.Vc.toFixed(2)} kN ${res.shearSafe ? ">" : "<"} Vu=${inp.Vu} kN</td><td>${safe(res.shearSafe)}</td></tr>
</table>

<div class="ft">RCC Beam Jacketing Design Report | IS 456:2000 | ${date} | caffeine.ai</div>
</div>
<script>window.onload=function(){window.print()};</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "RCC_Beam_Jacketing_Report.html";
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
