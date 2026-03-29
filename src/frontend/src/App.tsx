import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Ruler,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BeamSectionSVG } from "./components/BeamDiagramSVG";
import { useStoreCalculation } from "./hooks/useQueries";
import {
  type BeamInputData,
  type CalculationResult,
  calculate,
} from "./lib/calculations";
import { exportToExcel } from "./lib/excelExport";
import { exportToPDF } from "./lib/pdfExport";
import { exportSectionDiagrams } from "./lib/pngExport";

const queryClient = new QueryClient();

type FormStr = {
  designation: string;
  Mu: string;
  fck: string;
  fy: string;
  b: string;
  D: string;
  d: string;
  Vu: string;
};

const EMPTY_FORM: FormStr = {
  designation: "",
  Mu: "",
  fck: "",
  fy: "",
  b: "",
  D: "",
  d: "",
  Vu: "",
};

function ResultRow({
  label,
  value,
}: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function SafeBadge({ safe }: { safe: boolean }) {
  return safe ? (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded border border-green-300">
      <CheckCircle2 className="w-3 h-3" /> SAFE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded border border-red-300">
      <XCircle className="w-3 h-3" /> UNSAFE
    </span>
  );
}

function AppContent() {
  const [formStr, setFormStr] = useState<FormStr>(EMPTY_FORM);
  const [parsedForm, setParsedForm] = useState<BeamInputData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalc, setIsCalc] = useState(false);
  const storeMutation = useStoreCalculation();

  function handleChange(key: keyof FormStr, val: string) {
    setFormStr((prev) => ({ ...prev, [key]: val }));
  }

  function handleCalculate() {
    const numFields: (keyof FormStr)[] = [
      "Mu",
      "fck",
      "fy",
      "b",
      "D",
      "d",
      "Vu",
    ];
    for (const f of numFields) {
      if (formStr[f].trim() === "" || Number.isNaN(Number(formStr[f]))) {
        toast.error(`Please enter a valid value for ${f}`);
        return;
      }
    }
    const form: BeamInputData = {
      designation: formStr.designation.trim() || "\u2014",
      Mu: Number(formStr.Mu),
      fck: Number(formStr.fck),
      fy: Number(formStr.fy),
      b: Number(formStr.b),
      D: Number(formStr.D),
      d: Number(formStr.d),
      Vu: Number(formStr.Vu),
    };
    setIsCalc(true);
    setTimeout(() => {
      try {
        const res = calculate(form);
        setResult(res);
        setParsedForm(form);
        storeMutation.mutate({
          input: {
            fy: form.fy,
            fck: form.fck,
            factoredMomentMu: form.Mu,
            depthD: form.D,
            factoredShearVu: form.Vu,
            beamDesignation: form.designation,
            breadthB: form.b,
            effectiveDepthD: form.d,
          },
          output: {
            adoptedAst: res.Ast_adopted,
            factoredShear: form.Vu,
            actualMomentResistance: res.Mu_actual,
            overallSafeForBending: res.bendingSafe,
            minimumAst: res.Ast_min,
            isDoublyReinforced: res.isDoubly,
            safeMoment: res.Mu_actual,
            providedSteelMoreThanMin: res.Ast_adopted >= res.Ast_min,
            limitingMoment: res.Mlim,
            requiredAst: res.Ast_req,
            isUnsafe: !res.bendingSafe || !res.shearSafe,
            barSelection: {
              diameter: res.selectedBar.dia,
              quantity: BigInt(res.selectedBar.n),
            },
            effectiveDepthAdopted: res.d_new,
            shearAssessment: {
              shearSafe: res.shearSafe,
              shearStressTc: res.Tc,
              shearCapacityVc: res.Vc,
              percentageSteel: res.Pt,
            },
            neutralAxisDepth: res.Xu,
          },
        });
        toast.success("Design calculated successfully");
      } catch {
        toast.error("Calculation error. Please check inputs.");
      } finally {
        setIsCalc(false);
      }
    }, 300);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header
        className="relative text-white py-7 px-6"
        style={{
          background: "linear-gradient(135deg, #1E2A35 0%, #1F6FA8 100%)",
        }}
        data-ocid="header.section"
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,.3) 39px,rgba(255,255,255,.3) 40px),
              repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,.3) 39px,rgba(255,255,255,.3) 40px)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              RCC Beam Jacketing Design Tool
            </h1>
            <p className="text-blue-200 text-sm mt-0.5">
              IS 456:2000 | IS 15988-2013 | Limit State Method
            </p>
          </div>
        </div>
      </header>

      <main
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-6"
        data-ocid="main.section"
      >
        {/* LEFT: Input + Diagrams */}
        <div className="flex flex-col gap-5">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" /> Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label
                    htmlFor="designation"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Structural Element Designation
                  </Label>
                  <Input
                    id="designation"
                    value={formStr.designation}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    placeholder="e.g. B1"
                    className="mt-1"
                    data-ocid="designation.input"
                  />
                </div>
                {(
                  [
                    ["mu", "Mu", "Factored Moment, Mu (kNm)"],
                    ["fck", "fck", "fck by NDT Test (N/mm\u00b2)"],
                    ["fy", "fy", "fy (N/mm\u00b2)"],
                    ["b", "b", "Width b (mm)"],
                    ["D", "D", "Overall Depth D (mm)"],
                    ["d", "d", "Effective Depth d (mm)"],
                    ["vu", "Vu", "Shear Force Vu (kN)"],
                  ] as [string, keyof FormStr, string][]
                ).map(([id, key, label]) => (
                  <div key={id}>
                    <Label
                      htmlFor={id}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </Label>
                    <Input
                      id={id}
                      type="number"
                      value={formStr[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="Enter value"
                      className="mt-1"
                      data-ocid={`${id}.input`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button
                  onClick={handleCalculate}
                  disabled={isCalc}
                  className="w-full sm:w-auto font-semibold"
                  data-ocid="calculate.primary_button"
                >
                  {isCalc ? (
                    <>
                      <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate &amp; Design
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {result && parsedForm && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary" /> Beam
                      Cross-Section Diagrams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6 items-center justify-center py-2 overflow-x-auto">
                      <BeamSectionSVG
                        b={parsedForm.b}
                        D={parsedForm.D}
                        bars={null}
                        label="Existing Section"
                      />
                      <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0">
                        <ChevronRight className="w-6 h-6 text-primary" />
                        <span className="text-xs font-medium">Jacketing</span>
                        <span className="text-xs">+200mm width</span>
                        <span className="text-xs">+100mm depth</span>
                      </div>
                      <BeamSectionSVG
                        b={result.b_new}
                        D={result.D_new}
                        d={result.d_new}
                        cover={result.cover}
                        bars={result.selectedBar}
                        label="Jacketed Section"
                        isNew
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Results */}
        <div className="flex flex-col gap-5">
          <AnimatePresence mode="wait">
            {result && parsedForm ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-5"
              >
                <Card className="shadow-card" data-ocid="results.card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Design
                      Results
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {parsedForm.designation}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-0.5">
                    <div className="bg-secondary rounded-md px-3 py-2 mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Jacketed Section
                      </p>
                      <ResultRow
                        label="Section (b \u00d7 D)"
                        value={`${result.b_new} \u00d7 ${result.D_new} mm`}
                      />
                      <ResultRow
                        label="New Effective Depth"
                        value={`${result.d_new} mm`}
                      />
                    </div>

                    <ResultRow
                      label="Beam Type"
                      value={
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            result.isDoubly
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }`}
                        >
                          {result.isDoubly
                            ? "Doubly Reinforced"
                            : "Singly Reinforced"}
                        </Badge>
                      }
                    />

                    <Separator className="my-2" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Reinforcement
                    </p>
                    {/* Ast Required — integer display e.g. 327 mm² */}
                    <ResultRow
                      label="Ast Required"
                      value={`${result.Ast_req.toFixed(0)} mm\u00b2`}
                    />
                    {/* Ast Minimum — integer display e.g. 406 mm² */}
                    <ResultRow
                      label="Ast Minimum"
                      value={`${result.Ast_min.toFixed(0)} mm\u00b2`}
                    />
                    {/* Ast Adopted — already integer e.g. 418 mm² */}
                    <ResultRow
                      label="Ast Adopted"
                      value={
                        <span className="font-bold">
                          {`${result.Ast_adopted} mm`}&sup2;
                        </span>
                      }
                    />
                    {/* Bars Recommended — n-Φdia mm, Φ rendered as actual character */}
                    <ResultRow
                      label="Bars Recommended"
                      value={
                        <span className="font-bold text-red-700 text-base">
                          {result.selectedBar.n}
                          {"\u2013"}
                          {"\u03a6"}
                          {result.selectedBar.dia}
                          {" mm"}
                        </span>
                      }
                    />

                    <Separator className="my-2" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Bending
                    </p>
                    {/* Limiting Moment — 2 decimal places e.g. 147.12 kNm */}
                    <ResultRow
                      label="Limiting Moment (Mlim)"
                      value={`${result.Mlim.toFixed(2)} kNm`}
                    />
                    <ResultRow
                      label="Neutral Axis Depth (Xu)"
                      value={`${result.Xu.toFixed(2)} mm`}
                    />
                    <ResultRow
                      label="Moment of Resistance"
                      value={`${result.Mu_actual.toFixed(2)} kNm`}
                    />
                    <ResultRow
                      label="Bending Check"
                      value={<SafeBadge safe={result.bendingSafe} />}
                    />

                    <Separator className="my-2" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Shear
                    </p>
                    <ResultRow
                      label="% Steel (Pt)"
                      value={`${result.Pt.toFixed(3)} %`}
                    />
                    <ResultRow
                      label="Shear Stress (Tc)"
                      value={`${result.Tc.toFixed(3)} N/mm\u00b2`}
                    />
                    <ResultRow
                      label="Shear Capacity (Vc)"
                      value={`${result.Vc.toFixed(2)} kN`}
                    />
                    <ResultRow
                      label="Shear Check"
                      value={<SafeBadge safe={result.shearSafe} />}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-card" data-ocid="downloads.card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary" /> Download
                      Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => {
                        exportToExcel(parsedForm, result);
                        toast.success("Excel downloaded");
                      }}
                      variant="outline"
                      className="w-full justify-start gap-3 border-green-200 hover:bg-green-50 hover:border-green-400 text-green-800"
                      data-ocid="excel.download_button"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">
                          Download Excel
                        </div>
                        <div className="text-xs opacity-70">
                          5-sheet design workbook (.xls)
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        exportSectionDiagrams(parsedForm, result);
                        toast.success("Section diagrams downloaded");
                      }}
                      variant="outline"
                      className="w-full justify-start gap-3 border-blue-200 hover:bg-blue-50 hover:border-blue-400 text-blue-800"
                      data-ocid="section.download_button"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">
                          Download Section Diagrams
                        </div>
                        <div className="text-xs opacity-70">
                          Old &amp; new sections as PNG
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => {
                        exportToPDF(parsedForm, result);
                        toast.info(
                          "Report opened \u2014 use Print \u2192 Save as PDF",
                        );
                      }}
                      variant="outline"
                      className="w-full justify-start gap-3 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-800"
                      data-ocid="report.download_button"
                    >
                      <FileText className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">
                          Download Report (PDF)
                        </div>
                        <div className="text-xs opacity-70">
                          Full design report with all calculations
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
                data-ocid="results.empty_state"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Calculator className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold">No Results Yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the parameters and click Calculate &amp; Design
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} IS 456:2000 RCC Beam Jacketing Design
        Tool
      </footer>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
