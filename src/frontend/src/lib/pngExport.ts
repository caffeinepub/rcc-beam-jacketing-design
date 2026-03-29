import type { BeamInputData, CalculationResult } from "./calculations";

export function exportSectionDiagrams(
  inp: BeamInputData,
  res: CalculationResult,
): void {
  const canvas = document.createElement("canvas");
  const W = 1200;
  const H = 700;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1E2A35";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("RCC BEAM JACKETING - CROSS SECTION DIAGRAMS", W / 2, 42);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#555";
  ctx.fillText(`Element: ${inp.designation} | IS 456:2000`, W / 2, 66);
  ctx.strokeStyle = "#1F6FA8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 82);
  ctx.lineTo(W - 40, 82);
  ctx.stroke();

  drawSec(ctx, {
    x: 80,
    y: 130,
    b: inp.b,
    D: inp.D,
    title: "EXISTING SECTION",
    sub: `${inp.b} x ${inp.D} mm`,
    bars: null,
  });
  drawSec(ctx, {
    x: 640,
    y: 130,
    b: res.b_new,
    D: res.D_new,
    title: "JACKETED SECTION",
    sub: `${res.b_new} x ${res.D_new} mm`,
    bars: res.selectedBar,
    d_new: res.d_new,
    cover: res.cover,
  });

  ctx.fillStyle = "#999";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "IS 456:2000 | RCC Beam Jacketing | Dimensions in mm",
    W / 2,
    H - 20,
  );

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Beam_Section_Diagrams.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

interface SD {
  x: number;
  y: number;
  b: number;
  D: number;
  title: string;
  sub: string;
  bars: { n: number; dia: number } | null;
  d_new?: number;
  cover?: number;
}

function drawSec(ctx: CanvasRenderingContext2D, o: SD) {
  const sc = Math.min(370 / o.b, 480 / o.D);
  const sw = o.b * sc;
  const sh = o.D * sc;
  const bx = o.x;
  const by = o.y;
  ctx.fillStyle = "#1E2A35";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "left";
  ctx.fillText(o.title, bx, by - 10);
  ctx.fillStyle = "#1F6FA8";
  ctx.font = "11px Arial";
  ctx.fillText(o.sub, bx, by + 4);
  ctx.fillStyle = o.bars ? "#EBF3FB" : "#F3F3F3";
  ctx.fillRect(bx, by + 18, sw, sh);
  ctx.strokeStyle = "#1E2A35";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(bx, by + 18, sw, sh);
  ctx.strokeStyle = "#CCC";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < sw + sh; i += 18) {
    ctx.beginPath();
    ctx.moveTo(bx + Math.max(0, i - sh), by + 18 + Math.min(i, sh));
    ctx.lineTo(bx + Math.min(i, sw), by + 18 + Math.max(0, i - sw));
    ctx.stroke();
  }
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(bx + 12, by + 30, sw - 24, sh - 24);
  ctx.setLineDash([]);
  const cover = o.cover ?? 40;
  if (o.bars) {
    const { n, dia } = o.bars;
    const r = Math.max(dia * sc * 0.55, 5);
    const barY = by + 18 + sh - cover * sc - r;
    const sp = n === 1 ? 0 : (sw - 2 * cover * sc) / (n - 1);
    ctx.fillStyle = "#CC3333";
    ctx.strokeStyle = "#880000";
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const cx = bx + cover * sc + i * sp;
      ctx.beginPath();
      ctx.arc(cx, barY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#CC3333";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${n}-${String.fromCharCode(934)}${dia}mm`,
      bx + sw / 2,
      barY + r + 16,
    );
    if (o.d_new) {
      ctx.strokeStyle = "#1F6FA8";
      ctx.fillStyle = "#1F6FA8";
      ctx.lineWidth = 1;
      const dsc = o.d_new * sc;
      ctx.beginPath();
      ctx.moveTo(bx + sw + 16, by + 18);
      ctx.lineTo(bx + sw + 16, by + 18 + dsc);
      ctx.stroke();
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`d=${o.d_new}mm`, bx + sw + 20, by + 18 + dsc / 2);
    }
  } else {
    ctx.fillStyle = "#999";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("(No Steel - Corroded)", bx + sw / 2, by + 18 + sh / 2 + 4);
  }
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx, by + 18 + sh + 22);
  ctx.lineTo(bx + sw, by + 18 + sh + 22);
  ctx.stroke();
  ctx.fillStyle = "#333";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${o.b} mm`, bx + sw / 2, by + 18 + sh + 36);
  ctx.beginPath();
  ctx.moveTo(bx - 20, by + 18);
  ctx.lineTo(bx - 20, by + 18 + sh);
  ctx.stroke();
  ctx.save();
  ctx.translate(bx - 30, by + 18 + sh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(`${o.D} mm`, 0, 0);
  ctx.restore();
}
