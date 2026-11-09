import { getBarBits } from './barcodeBits';

// Printer dots per mm (203 dpi = 7.99, 300 dpi = 11.81)
export const dotsPerMM = (dpi) => dpi / 25.4;

const FONT_STACKS = {
  inter: '"Inter", Arial, Helvetica, sans-serif',
  'roboto-mono': '"Roboto Mono", "Courier New", monospace',
  arial: 'Arial, Helvetica, sans-serif',
};

export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (clean)' },
  { value: 'roboto-mono', label: 'Roboto Mono (technical)' },
  { value: 'arial', label: 'Arial (system)' },
];

const THRESHOLD = 170; // gray below this prints black. Higher = darker text.

let fontsPromise = null;
export function loadLabelFonts() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  if (!fontsPromise) {
    const sample = '₱0123456789 Aa';
    fontsPromise = Promise.all([
      document.fonts.load('600 24px "Inter"', sample),
      document.fonts.load('700 24px "Inter"', sample),
      document.fonts.load('800 24px "Inter"', sample),
      document.fonts.load('600 24px "Roboto Mono"', sample),
      document.fonts.load('700 24px "Roboto Mono"', sample),
    ]).catch(() => {});
  }
  return fontsPromise;
}

function fitFont(ctx, text, weight, family, px, maxWidth) {
  let size = px;
  const minSize = px * 0.55;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  let out = text;
  while (ctx.measureText(out).width > maxWidth && out.length > 1) {
    out = out.slice(0, -1);
    ctx.font = `${weight} ${size}px ${family}`;
  }
  if (out !== text) out = out.slice(0, -1) + '…';
  return { text: out, size };
}

function drawText(ctx, text, x, baseline, bold) {
  ctx.fillText(text, x, baseline);
  if (bold > 0) {
    ctx.lineWidth = bold;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, baseline);
  }
}

function drawSpaced(ctx, text, centerX, baseline, spacing, bold) {
  const widths = Array.from(text).map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = centerX - total / 2;
  Array.from(text).forEach((c, i) => {
    drawText(ctx, c, x + widths[i] / 2, baseline, bold);
    x += widths[i] + spacing;
  });
}

// Draws the full label at printer resolution and returns { fits, notes, moduleDots }.
// The canvas ends up pure black/white, exactly what the printer receives.
export async function drawProductLabel(canvas, product, settings) {
  await loadLabelFonts();

  const dpm = dotsPerMM(settings.printerDpi || 203);
  const W = Math.round(settings.labelWidthMM * dpm);
  const H = Math.round(settings.labelHeightMM * dpm);
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const margin = Math.round(1.4 * dpm);
  const innerW = W - margin * 2;
  const bold = Number(settings.textBoldness) || 0;
  const notes = [];

  const labelFamily = FONT_STACKS[settings.labelFont] || FONT_STACKS.inter;
  const digitsFamily = FONT_STACKS[settings.digitsFont] || FONT_STACKS['roboto-mono'];

  // ---- Barcode geometry
  let bits = '';
  let barcodeError = false;
  try {
    bits = getBarBits(product.barcode, product.barcode_type);
  } catch (e) {
    barcodeError = true;
    notes.push('Invalid barcode value.');
  }
  const isEAN = product.barcode_type !== 'CODE128';
  const quietLeft = isEAN ? 11 : 10;
  const quietRight = isEAN ? 7 : 10;
  const totalModules = bits.length + quietLeft + quietRight;
  let moduleDots = 0;
  if (!barcodeError) {
    const fit = Math.floor(innerW / totalModules);
    const best = Math.max(2, Math.round(0.4 * dpm)); // about 0.4 mm narrow bar
    const wanted = settings.barModule === 'auto' ? best : Number(settings.barModule);
    moduleDots = Math.max(1, Math.min(wanted, fit));
    if (settings.barModule !== 'auto' && moduleDots < wanted) {
      notes.push(`Barcode too wide for label. Bars reduced to ${moduleDots} dots.`);
    }
    if (moduleDots < 2) notes.push('Barcode may not scan. Use a wider label or shorter code.');
  }

  // ---- Layout pass (measure, then center vertically)
  const items = [];
  const gap = Math.round(0.5 * dpm);

  if (settings.showProductName && product.name) {
    const px = settings.nameSizeMM * dpm;
    const f = fitFont(ctx, product.name, 700, labelFamily, px, innerW);
    items.push({ kind: 'name', text: f.text, size: f.size, height: f.size * 1.18 });
  }
  if (settings.showPrice) {
    const px = settings.priceSizeMM * dpm;
    const text = `${settings.currencySymbol}${Number(product.price || 0).toFixed(2)}`;
    const f = fitFont(ctx, text, 800, labelFamily, px, innerW);
    items.push({ kind: 'price', text: f.text, size: f.size, height: f.size * 1.18 });
  }
  const barH = Math.round(settings.barcodeHeightMM * dpm);
  items.push({ kind: 'bars', height: barH });
  if (settings.showBarcodeNumber) {
    const px = settings.digitsSizeMM * dpm;
    items.push({ kind: 'digits', size: px, height: px * 1.2 });
  }

  const total = items.reduce((s, it, i) => s + it.height + (i ? gap : 0), 0);
  const fits = total <= H - margin * 2 + 1;
  if (!fits) notes.push('Content is taller than the label. Reduce sizes or use a taller label.');

  let y = fits ? (H - total) / 2 : margin;

  items.forEach((it) => {
    if (it.kind === 'name' || it.kind === 'price') {
      ctx.font = `${it.kind === 'price' ? 800 : 700} ${it.size}px ${labelFamily}`;
      drawText(ctx, it.text, W / 2, y + it.size * 0.9, bold);
    } else if (it.kind === 'bars' && !barcodeError) {
      const barsW = bits.length * moduleDots;
      const left = Math.round((W - (barsW + (quietLeft + quietRight) * moduleDots)) / 2);
      const x0 = left + quietLeft * moduleDots;
      let run = 0;
      for (let i = 0; i <= bits.length; i++) {
        if (bits[i] === '1') {
          run++;
        } else if (run) {
          ctx.fillRect(x0 + (i - run) * moduleDots, Math.round(y), run * moduleDots, barH);
          run = 0;
        }
      }
      it.x0 = x0;
    } else if (it.kind === 'bars' && barcodeError) {
      ctx.font = `700 ${Math.round(2.5 * dpm)}px ${labelFamily}`;
      ctx.fillText('INVALID BARCODE', W / 2, y + barH / 2);
    } else if (it.kind === 'digits' && !barcodeError) {
      ctx.font = `700 ${it.size}px ${digitsFamily}`;
      const baseline = y + it.size * 0.92;
      const barsItem = items.find((i) => i.kind === 'bars');
      const x0 = barsItem.x0;
      const code = String(product.barcode);
      if (isEAN && code.length === 13) {
        // Standard EAN-13 layout: first digit in the left quiet zone, 6 + 6 under the bars
        drawText(ctx, code[0], x0 - quietLeft * moduleDots * 0.5, baseline, bold);
        for (let k = 0; k < 6; k++) {
          const cx = x0 + (3 + k * 7 + 3.5) * moduleDots;
          drawText(ctx, code[1 + k], cx, baseline, bold);
        }
        for (let k = 0; k < 6; k++) {
          const cx = x0 + (50 + k * 7 + 3.5) * moduleDots;
          drawText(ctx, code[7 + k], cx, baseline, bold);
        }
      } else {
        const barsW = bits.length * moduleDots;
        drawSpaced(ctx, code, x0 + barsW / 2, baseline, Math.max(1, it.size * 0.12), bold);
      }
    }
    y += it.height + gap;
  });

  if (settings.showBorder) {
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  // Binarize: preview equals print
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] + d[i + 1] + d[i + 2]) / 3 < THRESHOLD ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  return { fits, notes, moduleDots, width: W, height: H };
}
