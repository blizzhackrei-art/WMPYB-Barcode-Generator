import React, { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { drawProductLabel } from '../barcode/drawLabel';

function LabelPreview({ product, canvasRef: externalRef }) {
  const { settings } = useSettings();
  const internalRef = useRef(null);
  const canvasRef = externalRef || internalRef;
  const widthMM = settings.labelWidthMM;
  const heightMM = settings.labelHeightMM;
  const showName = settings.showProductName;
  const showPrice = settings.showPrice;
  const scaleMultiplier = settings.previewSize === 'large' ? 6 : 3;

  useEffect(() => {
    if (!product || !canvasRef.current) return;
    drawProductLabel(canvasRef.current, product, {
      widthMM,
      heightMM,
      showName,
      showPrice,
      currencySymbol: settings.currencySymbol,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, widthMM, heightMM, showName, showPrice, settings.currencySymbol]);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, display: 'inline-block', padding: 8, background: '#fff' }}>
      <canvas ref={canvasRef} style={{ width: `${widthMM * scaleMultiplier}px`, height: `${heightMM * scaleMultiplier}px`, display: 'block', maxWidth: '100%' }} />
    </div>
  );
}

export default LabelPreview;
