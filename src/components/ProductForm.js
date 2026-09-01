import React, { useState } from 'react';
import { randomEAN13, randomCode128, isValidEAN13 } from '../barcode/generateCode';
import { useSettings } from '../context/SettingsContext';

function ProductForm({ onGenerate }) {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcodeType, setBarcodeType] = useState('EAN13');
  const [barcode, setBarcode] = useState('');
  const [mode, setMode] = useState('random');

  function handleGenerateRandom() {
    const code = barcodeType === 'EAN13' ? randomEAN13() : randomCode128();
    setBarcode(code);
  }

  function handleSubmit() {
    if (settings.showProductName && !name) {
      alert('Enter product name.');
      return;
    }
    if (settings.showPrice && !price) {
      alert('Enter price.');
      return;
    }
    let finalCode = barcode;
    if (mode === 'random' && !finalCode) {
      finalCode = barcodeType === 'EAN13' ? randomEAN13() : randomCode128();
      setBarcode(finalCode);
    }
    if (mode === 'manual' && barcodeType === 'EAN13' && !isValidEAN13(finalCode)) {
      alert('Invalid EAN13 code. Must be 13 digits with correct check digit.');
      return;
    }
    if (!finalCode) {
      alert('Generate or enter a barcode first.');
      return;
    }

    onGenerate({
      name: name || '',
      price: price ? parseFloat(price) : 0,
      barcode: finalCode,
      barcode_type: barcodeType,
    });
  }

  return (
    <div className="card">
      {settings.showProductName && (
        <div className="field">
          <label>Product Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Colorful SL300 SSD" />
        </div>
      )}

      {settings.showPrice && (
        <div className="field">
          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 2500.00" />
        </div>
      )}

      <div className="field">
        <label>Barcode Type</label>
        <select value={barcodeType} onChange={(e) => { setBarcodeType(e.target.value); setBarcode(''); }}>
          <option value="EAN13">EAN13</option>
          <option value="CODE128">Code 128</option>
        </select>
      </div>

      <div className="field">
        <label>Barcode Source</label>
        <select value={mode} onChange={(e) => { setMode(e.target.value); setBarcode(''); }}>
          <option value="random">Random</option>
          <option value="manual">Manual Entry</option>
        </select>
      </div>

      {mode === 'random' && (
        <div className="field">
          <label>Generated Code</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleGenerateRandom} type="button">Generate</button>
            <span style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{barcode}</span>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="field">
          <label>Barcode Value</label>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={barcodeType === 'EAN13' ? '13-digit number' : 'Any text/number'}
          />
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: 8 }}>
        Generate Label
      </button>
    </div>
  );
}

export default ProductForm;
