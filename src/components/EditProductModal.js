import React, { useState } from 'react';
import { Field, Notice } from './ui';

function EditProductModal({ product, onSave, onClose }) {
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price ?? '');
  const [error, setError] = useState('');

  function handleSave(e) {
    e.preventDefault();
    if (!name.trim() && price === '') return setError('Enter a name or a price.');
    onSave({ ...product, name: name.trim(), price: parseFloat(price) || 0 });
  }

  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label="Edit product">
      <form className="modal card" onSubmit={handleSave}>
        <h2 className="card-title">Edit product</h2>
        <Field label="Product name">
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Price">
          <input type="number" inputMode="decimal" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <p className="row-hint">Barcode {product.barcode} stays the same.</p>
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}

export default EditProductModal;
