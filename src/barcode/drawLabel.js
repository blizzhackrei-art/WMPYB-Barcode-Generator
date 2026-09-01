import JsBarcode from 'jsbarcode';

// Shared drawing logic used by LabelPreview and reprint-from-Products-page
export function drawProductLabel(canvas, product, options) {
  const { widthMM, heightMM, showName, showPrice, currencySymbol, dpi = 8 } = options;
  const w = widthMM * dpi;
  const h = heightMM * dpi;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';

  let cursorY = 4;

  if (showName) {
    ctx.font = `bold ${Math.floor(h * 0.12)}px Arial`;
    ctx.fillText(truncate(product.name || '', 24), w / 2, cursorY + h * 0.12);
    cursorY += h * 0.16;
  }

  if (showPrice) {
    ctx.font = `bold ${Math.floor(h * 0.16)}px Arial`;
    ctx.fillText(`${currencySymbol}${Number(product.price || 0).toFixed(2)}`, w / 2, cursorY + h * 0.16);
    cursorY += h * 0.2;
  }

  const barcodeCanvas = document.createElement('canvas');
  try {
    JsBarcode(barcodeCanvas, product.barcode, {
      format: product.barcode_type === 'CODE128' ? 'CODE128' : 'EAN13',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 0,
    });
    const remainingH = h - cursorY - 2;
    const scale = Math.min((w - 10) / barcodeCanvas.width, remainingH / barcodeCanvas.height);
    const drawW = barcodeCanvas.width * scale;
    const drawH = barcodeCanvas.height * scale;
    ctx.drawImage(barcodeCanvas, (w - drawW) / 2, cursorY, drawW, drawH);
  } catch (err) {
    ctx.font = '12px Arial';
    ctx.fillText('Invalid barcode', w / 2, cursorY + 20);
  }

  return canvas;
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
