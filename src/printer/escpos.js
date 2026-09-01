// Builds ESC/POS raw bytes to print a canvas image on thermal printers
// Works with XPrinter XP-T271U and most ESC/POS thermal label printers

// Converts a canvas (label) into monochrome bitmap, then wraps in ESC/POS GS v 0 raster command
export function canvasToEscPos(canvas, thresholdValue = 128) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);

  // Width must be byte-aligned (multiple of 8)
  const widthBytes = Math.ceil(width / 8);
  const bitmap = new Uint8Array(widthBytes * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const gray = (r + g + b) / 3;
      const isBlack = gray < thresholdValue ? 1 : 0;

      if (isBlack) {
        const byteIndex = y * widthBytes + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  // ESC/POS raster bit image command: GS v 0
  const xL = widthBytes & 0xff;
  const xH = (widthBytes >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  const initPrinter = new Uint8Array([0x1b, 0x40]); // ESC @  reset printer
  const feedAndCut = new Uint8Array([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]); // feed + cut (if supported)

  const result = new Uint8Array(initPrinter.length + header.length + bitmap.length + feedAndCut.length);
  let offset = 0;
  result.set(initPrinter, offset); offset += initPrinter.length;
  result.set(header, offset); offset += header.length;
  result.set(bitmap, offset); offset += bitmap.length;
  result.set(feedAndCut, offset);

  return result;
}

// Splits large byte array into BLE-safe chunks (most BLE MTU ~ 180-500 bytes)
export function chunkBytes(bytes, chunkSize = 180) {
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize));
  }
  return chunks;
}
