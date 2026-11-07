// TSPL builder for label printers (XPrinter XP-T271U, TSC-style).
// Raster approach: canvas -> 1-bit BITMAP, so preview and print match exactly.
// 203 dpi printers = 8 dots/mm, same as the 8 px/mm canvas in drawLabel.js.

function ascii(text) {
  return Array.from(text).map((c) => c.charCodeAt(0) & 0xff);
}

export function canvasToTspl(canvas, opts) {
  const {
    widthMM,
    heightMM,
    gapMM = 2,
    density = 8,
    speed = 4,
    copies = 1,
    threshold = 128,
  } = opts;

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height).data;
  const widthBytes = Math.ceil(width / 8);
  const bitmap = new Uint8Array(widthBytes * height);

  // TSPL BITMAP: bit 1 = white (no dot), bit 0 = black (dot). Start all white.
  bitmap.fill(0xff);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = (img[i] + img[i + 1] + img[i + 2]) / 3;
      if (gray < threshold) {
        bitmap[y * widthBytes + (x >> 3)] &= ~(0x80 >> (x & 7));
      }
    }
  }

  const head = ascii(
    `SIZE ${widthMM} mm,${heightMM} mm\r\n` +
      `GAP ${gapMM} mm,0 mm\r\n` +
      `DIRECTION 1\r\n` +
      `DENSITY ${density}\r\n` +
      `SPEED ${speed}\r\n` +
      `CLS\r\n` +
      `BITMAP 0,0,${widthBytes},${height},0,`
  );
  const tail = ascii(`\r\nPRINT ${copies},1\r\n`);

  const out = new Uint8Array(head.length + bitmap.length + tail.length);
  out.set(head, 0);
  out.set(bitmap, head.length);
  out.set(tail, head.length + bitmap.length);
  return out;
}
