import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useSettings } from '../context/SettingsContext';

function LabelPreview({ product, canvasRef: externalRef }) {
  const { settings } = useSettings();
  const internalRef = useRef(null);
  const canvasRef = externalRef || internalRef;
  const widthMM = settings.labelWidthMM;
  const heightMM = settings.labelHeightMM;
  const showName = settings.showProductName;
  const showPrice = settings.showPrice;

  useEffect(() => {
    if (!product) return;
    drawLabel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, widthMM, heightMM, showName, showPrice]);

  function drawLabel() {
    const dpi = 8;
    const canvas = canvasRef.current;
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
      ctx.fillText(truncate(product.name, 24), w / 2, cursorY + h * 0.12);
      cursorY += h * 0.16;
    }

    if (showPrice) {
      ctx.font = `bold ${Math.floor(h * 0.16)}px Arial`;
      ctx.fillText(`${settings.currencySymbol}${Number(product.price).toFixed(2)}`, w / 2, cursorY + h * 0.16);
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
  }

  function truncate(text, max) {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, display: 'inline-block', padding: 8, background: '#fff' }}>
      <canvas ref={canvasRef} style={{ width: `${widthMM * 3}px`, height: `${heightMM * 3}px`, display: 'block' }} />
    </div>
  );
}

export default LabelPreview;
