// Generates barcode numbers for EAN13 and Code128

// EAN13 needs 12 digits + 1 check digit = 13 total
export function randomEAN13() {
  let digits = '';
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits + calculateEAN13CheckDigit(digits);
}

function calculateEAN13CheckDigit(digits12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

// Code128 accepts any alphanumeric text, no check digit needed manually
export function randomCode128(prefix = 'PRD') {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${random}`;
}

// Validate EAN13 (13 digits, correct check digit)
export function isValidEAN13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const check = calculateEAN13CheckDigit(code.slice(0, 12));
  return check === parseInt(code[12], 10);
}
