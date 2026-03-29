import type { BeamInputData, CalculationResult } from "./calculations";
import { TABLE_19_FULL } from "./calculations";

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cell(v: string | number, style?: string): string {
  const t = typeof v === "number" ? "Number" : "String";
  const st = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${st}><Data ss:Type="${t}">${esc(v)}</Data></Cell>`;
}

function row(...cells: string[]): string {
  return `<Row>${cells.join("")}</Row>`;
}
function hrow(...vals: (string | number)[]): string {
  return row(...vals.map((v) => cell(v, "H")));
}
function srow(v: string | number): string {
  return row(cell(v, "S"));
}
function frow(v: string | number): string {
  return row(cell(v, "F"));
}
function irow(label: string, val: string | number, unit: string): string {
  return row(cell(label, "IL"), cell(val, "IV"), cell(unit, "IL"));
}

function ws1(inp: BeamInputData): string {
  return `<Worksheet ss:Name="INPUT DATA"><Table>
${row(cell("RCC BEAM JACKETING DESIGN - INPUT DATA", "T"))}
${row(cell(""))}
${hrow("Parameter", "Value", "Unit")}
${irow("Structural Element Designation", inp.designation, "-")}
${irow("Factored Moment (Mu)", inp.Mu, "kNm")}
${irow("Grade of Concrete by NDT (fck)", inp.fck, "N/mm2")}
${irow("Grade of Steel (fy)", inp.fy, "N/mm2")}
${irow("Width of Beam (b)", inp.b, "mm")}
${irow("Overall Depth (D)", inp.D, "mm")}
${irow("Effective Depth (d)", inp.d, "mm")}
${irow("Factored Shear Force (Vu)", inp.Vu, "kN")}
${row(cell(""))}
${row(cell("JACKETED SECTION (AUTO-CALCULATED)", "T"))}
${irow("New Width (b_new = b+200)", inp.b + 200, "mm")}
${irow("New Overall Depth (D_new = D+100)", inp.D + 100, "mm")}
${irow("Effective Cover", 40, "mm")}
${irow("New Effective Depth (d_new)", inp.D + 60, "mm")}
</Table></Worksheet>`;
}

function ws2(inp: BeamInputData, r: CalculationResult): string {
  const Ast_gov = Math.max(r.Ast_req, r.Ast_min);
  return `<Worksheet ss:Name="FLEXURAL DESIGN"><Table>
${row(cell("STEP-BY-STEP FLEXURAL DESIGN (IS 456:2000)", "T"))}
${row(cell(""))}
${srow("STEP 1: LIMITING MOMENT CAPACITY")}
${frow("Formula: Mlim = 0.138 x fck x b_new x d_new^2")}
${row(cell(`Mlim = 0.138 x ${inp.fck} x ${r.b_new} x ${r.d_new}^2`))}
${row(cell(`Mlim = ${r.Mlim.toFixed(2)} kNm`))}
${row(cell(`Required Mu = ${inp.Mu} kNm`))}
${row(cell(`Mu (${inp.Mu}) ${inp.Mu <= r.Mlim ? "<= " : "> "}Mlim (${r.Mlim.toFixed(2)}) => ${r.isDoubly ? "DOUBLY REINFORCED" : "SINGLY REINFORCED"}`, r.isDoubly ? "US" : "SF"))}
${row(cell(""))}
${srow("STEP 2: REQUIRED AST")}
${frow("Formula: Ast_req = (Mu x 10^6) / (0.87 x fy x 0.9 x d_new)")}
${row(cell(`Ast_req = (${inp.Mu} x 10^6) / (0.87 x ${inp.fy} x 0.9 x ${r.d_new})`))}
${row(cell(`Ast_req = ${r.Ast_req.toFixed(2)} mm2`))}
${row(cell(""))}
${srow("STEP 3: MINIMUM STEEL (IS 456 Cl. 26.5.1.1)")}
${frow("Formula: Ast_min = (0.85 x b_new x d_new) / fy")}
${row(cell(`Ast_min = (0.85 x ${r.b_new} x ${r.d_new}) / ${inp.fy} = ${r.Ast_min.toFixed(2)} mm2`))}
${row(cell(`Governing Ast = max(${r.Ast_req.toFixed(0)}, ${r.Ast_min.toFixed(0)}) = ${Ast_gov.toFixed(2)} mm2`))}
${row(cell(""))}
${srow("STEP 4: BAR SELECTION")}
${hrow("Combination", "Dia (mm)", "No.", "Area (mm2)", "Suitable?")}
${row(cell("2 - 12 mm"), cell(12), cell(2), cell(226), cell(226 >= Ast_gov ? "YES" : "NO"))}
${row(cell("2 - 16 mm"), cell(16), cell(2), cell(402), cell(402 >= Ast_gov ? "YES" : "NO"))}
${row(cell("3 - 16 mm"), cell(16), cell(3), cell(603), cell(603 >= Ast_gov ? "YES" : "NO"))}
${row(cell("2 - 20 mm"), cell(20), cell(2), cell(628), cell(628 >= Ast_gov ? "YES" : "NO"))}
${row(cell(`SELECTED: ${r.selectedBar.n}-Phi${r.selectedBar.dia}mm`, "SF"), cell(r.selectedBar.dia, "SF"), cell(r.selectedBar.n, "SF"), cell(r.selectedBar.area, "SF"), cell("ADOPTED", "SF"))}
${row(cell(""))}
${srow("STEP 5: NEUTRAL AXIS DEPTH")}
${frow("Formula: Xu = (0.87 x fy x Ast) / (0.36 x fck x b_new)")}
${row(cell(`Xu = (0.87 x ${inp.fy} x ${r.Ast_adopted}) / (0.36 x ${inp.fck} x ${r.b_new}) = ${r.Xu.toFixed(2)} mm`))}
${row(cell(`Xu_max = 0.48 x ${r.d_new} = ${r.Xu_max.toFixed(2)} mm`))}
${row(cell(`Xu (${r.Xu.toFixed(2)}) ${r.Xu <= r.Xu_max ? "<= " : "> "}Xu_max (${r.Xu_max.toFixed(2)}) => ${r.Xu <= r.Xu_max ? "Under-reinforced (OK)" : "EXCEEDS LIMIT"}`))}
${row(cell(""))}
${srow("STEP 6: ACTUAL MOMENT OF RESISTANCE")}
${frow("Formula: Mu_actual = 0.87 x fy x Ast x (d_new - 0.42 x Xu) / 10^6")}
${row(cell(`Mu_actual = 0.87 x ${inp.fy} x ${r.Ast_adopted} x (${r.d_new} - 0.42 x ${r.Xu.toFixed(2)}) / 10^6`))}
${row(cell(`Mu_actual = ${r.Mu_actual.toFixed(2)} kNm`))}
${row(cell(`Mu_actual (${r.Mu_actual.toFixed(2)}) ${r.bendingSafe ? ">" : "<"} Mu (${inp.Mu}) => ${r.bendingSafe ? "SAFE IN BENDING" : "UNSAFE IN BENDING"}`, r.bendingSafe ? "SF" : "US"))}
</Table></Worksheet>`;
}

function ws3(inp: BeamInputData, r: CalculationResult): string {
  const t19 = TABLE_19_FULL.map((x) =>
    row(
      cell(x.pt),
      cell(x.m15, "YH"),
      cell(x.m20),
      cell(x.m25),
      cell(x.m30),
      cell(x.m35),
      cell(x.m40),
    ),
  ).join("\n");
  return `<Worksheet ss:Name="SHEAR DESIGN"><Table>
${row(cell("STEP-BY-STEP SHEAR DESIGN (IS 456:2000)", "T"))}
${row(cell(""))}
${srow("STEP 1: PERCENTAGE STEEL")}
${frow("Formula: Pt = (100 x Ast) / (b_new x d_new)")}
${row(cell(`Pt = (100 x ${r.Ast_adopted}) / (${r.b_new} x ${r.d_new}) = ${r.Pt.toFixed(3)} %`))}
${row(cell(""))}
${srow("STEP 2: IS 456 TABLE 19 - PERMISSIBLE SHEAR STRESS (N/mm2)")}
${hrow("Pt (%)", "M15*", "M20", "M25", "M30", "M35", "M40+")}
${t19}
${row(cell(`* M15 used for fck=${inp.fck} N/mm2`))}
${row(cell(""))}
${srow("STEP 3: INTERPOLATION")}
${frow("Formula: Tc = T1 + [(Pt - P1)/(P2 - P1)] x (T2 - T1)")}
${row(cell(`For Pt = ${r.Pt.toFixed(3)} % => Tc = ${r.Tc.toFixed(3)} N/mm2`))}
${row(cell(""))}
${srow("STEP 4: SHEAR CAPACITY")}
${frow("Formula: Vc = Tc x b_new x d_new / 1000")}
${row(cell(`Vc = ${r.Tc.toFixed(3)} x ${r.b_new} x ${r.d_new} / 1000 = ${r.Vc.toFixed(2)} kN`))}
${row(cell(`Vc (${r.Vc.toFixed(2)}) ${r.shearSafe ? ">" : "<"} Vu (${inp.Vu}) => ${r.shearSafe ? "SAFE IN SHEAR" : "UNSAFE IN SHEAR"}`, r.shearSafe ? "SF" : "US"))}
</Table></Worksheet>`;
}

function ws4(inp: BeamInputData, r: CalculationResult): string {
  return `<Worksheet ss:Name="OUTPUT SUMMARY"><Table>
${row(cell("OUTPUT SUMMARY - RCC BEAM JACKETING DESIGN", "T"))}
${row(cell(""))}
${srow("EXISTING SECTION")}
${hrow("Parameter", "Value", "Unit")}
${row(cell("Designation"), cell(inp.designation), cell("-"))}
${row(cell("Width (b)"), cell(inp.b), cell("mm"))}
${row(cell("Overall Depth (D)"), cell(inp.D), cell("mm"))}
${row(cell("Effective Depth (d)"), cell(inp.d), cell("mm"))}
${row(cell("Existing Steel"), cell("NIL (corroded)"), cell("-"))}
${row(cell(""))}
${srow("JACKETED SECTION")}
${row(cell("New Width (b_new)"), cell(r.b_new), cell("mm"))}
${row(cell("New Overall Depth (D_new)"), cell(r.D_new), cell("mm"))}
${row(cell("New Effective Depth (d_new)"), cell(r.d_new), cell("mm"))}
${row(cell("Effective Cover"), cell(r.cover), cell("mm"))}
${row(cell(""))}
${srow("REINFORCEMENT DETAILS")}
${row(cell("Beam Type"), cell(r.isDoubly ? "Doubly Reinforced" : "Singly Reinforced"), cell("-"))}
${row(cell("Ast Required"), cell(r.Ast_req.toFixed(2)), cell("mm2"))}
${row(cell("Ast Minimum (IS 456)"), cell(r.Ast_min.toFixed(2)), cell("mm2"))}
${row(cell("Ast Adopted"), cell(r.Ast_adopted), cell("mm2"))}
${row(cell("Bars Provided"), cell(`${r.selectedBar.n}-Phi${r.selectedBar.dia}mm`), cell("-"))}
${row(cell("Neutral Axis Depth (Xu)"), cell(r.Xu.toFixed(2)), cell("mm"))}
${row(cell("Xu_max"), cell(r.Xu_max.toFixed(2)), cell("mm"))}
${row(cell("Actual Moment of Resistance"), cell(r.Mu_actual.toFixed(2)), cell("kNm"))}
${row(cell(""))}
${srow("SAFETY CHECKS")}
${hrow("Check", "Result", "Status")}
${row(cell("Bending"), cell(`Mu_actual=${r.Mu_actual.toFixed(2)} kNm ${r.bendingSafe ? ">" : "<"} Mu=${inp.Mu} kNm`), cell(r.bendingSafe ? "SAFE" : "UNSAFE", r.bendingSafe ? "SF" : "US"))}
${row(cell("Shear"), cell(`Vc=${r.Vc.toFixed(2)} kN ${r.shearSafe ? ">" : "<"} Vu=${inp.Vu} kN`), cell(r.shearSafe ? "SAFE" : "UNSAFE", r.shearSafe ? "SF" : "US"))}
</Table></Worksheet>`;
}

function ws5(): string {
  return `<Worksheet ss:Name="DIAGRAMS NOTE"><Table>
${row(cell("BEAM SECTION DIAGRAMS", "T"))}
${row(cell(""))}
${row(cell("Please download the Section Diagrams (PNG) from the web application for engineering cross-section drawings."))}
${row(cell("The PNG includes: Old beam section, New jacketed section, bar locations, dimensions, stirrups."))}
</Table></Worksheet>`;
}

export function exportToExcel(
  inp: BeamInputData,
  res: CalculationResult,
): void {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
<Styles>
  <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/><Alignment ss:WrapText="1"/></Style>
  <Style ss:ID="T"><Font ss:FontName="Calibri" ss:Size="13" ss:Bold="1" ss:Color="#1F3864"/><Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/></Style>
  <Style ss:ID="S"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1F6FA8"/><Interior ss:Color="#EBF3FB" ss:Pattern="Solid"/></Style>
  <Style ss:ID="H"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F6FA8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="IL"><Interior ss:Color="#FFFDE7" ss:Pattern="Solid"/></Style>
  <Style ss:ID="IV"><Font ss:Bold="1"/><Interior ss:Color="#FFF9C4" ss:Pattern="Solid"/></Style>
  <Style ss:ID="F"><Font ss:Italic="1" ss:Color="#555555"/><Interior ss:Color="#F5F5F5" ss:Pattern="Solid"/></Style>
  <Style ss:ID="SF"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2EAD66" ss:Pattern="Solid"/></Style>
  <Style ss:ID="US"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#E53E3E" ss:Pattern="Solid"/></Style>
  <Style ss:ID="YH"><Interior ss:Color="#FFF9C4" ss:Pattern="Solid"/></Style>
</Styles>
${ws1(inp)}
${ws2(inp, res)}
${ws3(inp, res)}
${ws4(inp, res)}
${ws5()}
</Workbook>`;

  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "RCC_Beam_Jacketing_Design_IS456.xls";
  a.click();
  URL.revokeObjectURL(url);
}
