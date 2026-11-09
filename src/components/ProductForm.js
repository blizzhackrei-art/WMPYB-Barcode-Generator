import React, { useState } from 'react';
import { randomEAN13, randomCode128, isValidEAN13 } from '../barcode/generateCode';
import { useSettings } from '../context/SettingsContext';
import { Field, Segmented, Notice, Icon } from './ui';

function ProductForm({ onGenerate }) {
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcodeType, setBarcodeType] = useState('EAN13');
  const [mode, setMode] = useState('random');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const newCode = (type) => (type === 'EAN13' ? randomEAN13() : randomCode128());

  function changeType(type) {
    setBarcodeType(type);
    setBarcode(mode === 'random' ? newCode(type) : '');
  }

  function changeMode(m) {
    setMode(m);
    setBarcode(m === 'random' ? newCode(barcodeType) : '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (settings.showProductName && !name.trim()) return setError('Enter a product name, or turn it off in Design.');
    if (settings.showPrice && price === '') return setError('Enter a price, or turn it off in Design.');

    const code = barcode || (mode === 'random' ? newCode(barcodeType) : '');
    if (!code) return setError('Enter a barcode value.');
    if (barcodeType === 'EAN13' && mode === 'manual' && !isValidEAN13(code)) {
      return setError('EAN-13 needs 13 digits with a correct check digit.');
    }
    setBarcode(code);
    onGenerate({
      name: name.trim(),
      price: price === '' ? 0 : parseFloat(price),
      barcode: code,
      barcode_type: barcodeType,
    });
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">Product</h2>

      {settings.showProductName && (
        <Field label="Product name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Colorful SL300 SSD 256GB" />
        </Field>
      )}
      {settings.showPrice && (
        <Field label="Price">
          <input type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500.00" />
        </Field>
      )}

      <div className="grid-2">
        <Field label="Barcode type">
          <Segmented
            label="Barcode type"
            value={barcodeType}
            onChange={changeType}
            options={[
              { value: 'EAN13', label: 'EAN-13' },
              { value: 'CODE128', label: 'Code 128' },
            ]}
          />
        </Field>
        <Field label="Barcode value">
          <Segmented
            label="Barcode value source"
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'random', label: 'Random' },
              { value: 'manual', label: 'Type it' },
            ]}
          />
        </Field>
      </div>

      {mode === 'random' ? (
        <Field label="Generated value">
          <div className="inline-row">
            <input readOnly value={barcode} placeholder="Press Generate new value" className="mono" />
            <button type="button" className="btn btn-secondary" onClick={() => setBarcode(newCode(barcodeType))}>
              <Icon name="refresh" size={18} /> New value
            </button>
          </div>
        </Field>
      ) : (
        <Field label="Barcode value" hint={barcodeType === 'EAN13' ? '13 digits, last digit is the check digit.' : 'Letters and numbers.'}>
          <input className="mono" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder={barcodeType === 'EAN13' ? '6971043070098' : 'ITEM-0001'} />
        </Field>
      )}

      {error && <Notice tone="bad">{error}</Notice>}

      <button type="submit" className="btn btn-primary btn-block">Create label</button>
    </form>
  );
}

export default ProductForm;
