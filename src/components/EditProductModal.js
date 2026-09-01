import React, { useState } from 'react';

function EditProductModal({ product, onSave, onClose }) {
  const [name, setName] = useState(product.name || '');
  const [price, setPrice] = useState(product.price || '');

  function handleSave() {
    if (!name && !price) {
      alert('Enter at least a name or price.');
      return;
    }
    onSave({ ...product, name, price: parseFloat(price) || 0 });
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100,
    }}>
      <div className="card" style={{ width: 360, background: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>Edit Product</h3>

        <div className="field">
          <label>Product Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default EditProductModal;
