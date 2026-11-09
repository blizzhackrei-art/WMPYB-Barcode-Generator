import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { drawProductLabel } from '../barcode/drawLabel';
import { Notice } from './ui';

// Die-cut sticker on a liner. The canvas is exactly what the printer receives.
function LabelPreview({ product, canvasRef: externalRef, dimmed = false }) {
  const { settings } = useSettings();
  const internalRef = useRef(null);
  const canvasRef = externalRef || internalRef;
  const [info, setInfo] = useState({ fits: true, notes: [] });
  const runId = useRef(0);

  useEffect(() => {
    if (!product || !canvasRef.current) return;
    const id = ++runId.current;
    drawProductLabel(canvasRef.current, product, settings).then((res) => {
      if (id === runId.current) setInfo(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, settings]);

  const maxWidth = settings.previewSize === 'large' ? 760 : 440;

  return (
    <div>
      <div className="stage">
        <div className="sticker" style={{ maxWidth, opacity: dimmed ? 0.45 : 1 }}>
          <canvas ref={canvasRef} />
        </div>
        <div className="stage-caption">
          {settings.labelWidthMM} x {settings.labelHeightMM} mm
          {info.moduleDots ? `, bars ${info.moduleDots} dots` : ''}
        </div>
      </div>
      {info.notes.map((n) => (
        <Notice key={n} tone="warn">{n}</Notice>
      ))}
    </div>
  );
}

export default LabelPreview;
