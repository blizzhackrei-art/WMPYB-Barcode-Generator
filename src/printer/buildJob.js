import { canvasToEscPos } from './escpos';
import { canvasToTspl } from './tspl';

// Picks printer language from settings and builds raw bytes.
export function buildPrintBytes(canvas, settings, copies = 1) {
  if (settings.printerLanguage === 'tspl') {
    return canvasToTspl(canvas, {
      widthMM: settings.labelWidthMM,
      heightMM: settings.labelHeightMM,
      gapMM: settings.tsplGapMM,
      density: settings.tsplDensity,
      speed: settings.tsplSpeed,
      copies,
    });
  }
  return canvasToEscPos(canvas);
}
