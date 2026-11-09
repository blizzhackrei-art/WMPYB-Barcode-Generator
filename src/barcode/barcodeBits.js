import JsBarcode from 'jsbarcode';

// Returns the bar pattern as a string of 0/1 modules (1 = black).
// Drawing bars ourselves keeps every bar an exact whole number of printer dots.
export function getBarBits(value, type) {
  const target = {};
  JsBarcode(target, value, {
    format: type === 'CODE128' ? 'CODE128' : 'EAN13',
    displayValue: false,
    margin: 0,
  });
  return target.encodings.map((e) => e.data).join('');
}
