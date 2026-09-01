import React, { useEffect, useState } from 'react';
import { getAllProducts, deleteProduct } from '../db/storage';
import { useSettings } from '../context/SettingsContext';

function ProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Load failed:', err);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    await deleteProduct(id);
    load();
  }

  return (
    <div>
      <h1 className="page-title">Products</h1>
      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
        ) : products.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No products saved yet. Generate a label to save one.</p>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Barcode</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name || '—'}</td>
                  <td>{settings.currencySymbol}{Number(p.price).toFixed(2)}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.barcode}</td>
                  <td>{p.barcode_type}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
