import React, { useEffect, useState, useRef } from 'react';
import { getAllProducts, deleteProduct, updateProduct } from '../db/storage';
import { useSettings } from '../context/SettingsContext';
import EditProductModal from '../components/EditProductModal';
import { drawProductLabel } from '../barcode/drawLabel';
import { isReady, notReadyMessage, printCanvas } from '../printer/printerService';

function ProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [status, setStatus] = useState('');
  const hiddenCanvasRef = useRef(null);

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

  async function handleSaveEdit(updated) {
    await updateProduct(updated.id, updated.name, updated.price);
    setEditingProduct(null);
    load();
  }

  async function handleReprint(product) {
    if (!isReady(settings)) {
      alert(notReadyMessage(settings) + ' (Generate page / Settings)');
      return;
    }
    setStatus(`Printing ${product.name || product.barcode}...`);
    try {
      const canvas = hiddenCanvasRef.current;
      drawProductLabel(canvas, product, {
        widthMM: settings.labelWidthMM,
        heightMM: settings.labelHeightMM,
        showName: settings.showProductName,
        showPrice: settings.showPrice,
        currencySymbol: settings.currencySymbol,
      });
      await printCanvas(canvas, settings);
      setStatus('Reprint sent successfully.');
    } catch (err) {
      setStatus('Reprint failed: ' + err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Products</h1>

      {status && (
        <div className="card" style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {status}
        </div>
      )}

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
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleReprint(p)}>Reprint</button>
                      <button className="btn btn-secondary" onClick={() => setEditingProduct(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onSave={handleSaveEdit}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Hidden canvas used only for reprint rendering, not shown to user */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default ProductsPage;
