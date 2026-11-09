import React, { useEffect, useState, useRef } from 'react';
import { getAllProducts, deleteProduct, updateProduct } from '../db/storage';
import { useSettings } from '../context/SettingsContext';
import EditProductModal from '../components/EditProductModal';
import { drawProductLabel } from '../barcode/drawLabel';
import { isReady, notReadyMessage, printCanvas } from '../printer/printerService';
import { Icon, Notice, PageHead } from '../components/ui';

function ProductsPage({ goTo }) {
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setProducts(await getAllProducts());
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

  async function handleSave(updated) {
    await updateProduct(updated.id, updated.name, updated.price);
    setEditing(null);
    load();
  }

  async function handleReprint(p) {
    setStatus(null);
    if (!isReady(settings)) {
      setStatus({ tone: 'warn', text: notReadyMessage(settings) });
      return;
    }
    try {
      await drawProductLabel(canvasRef.current, p, settings);
      await printCanvas(canvasRef.current, settings);
      setStatus({ tone: 'ok', text: `Sent ${p.name || p.barcode} to printer.` });
    } catch (err) {
      setStatus({ tone: 'bad', text: `Reprint failed. ${err.message || err}` });
    }
  }

  return (
    <div className="page">
      <PageHead title="Products" sub="Every label you create is saved here for reprint or edit." />

      {status && <Notice tone={status.tone}>{status.text}</Notice>}
      {status && status.tone === 'warn' && (
        <button className="btn btn-secondary" onClick={() => goTo('printer')}>Open printer setup</button>
      )}

      <div className="card list-card">
        {loading ? (
          <p className="row-hint">Loading...</p>
        ) : products.length === 0 ? (
          <div className="empty">
            <Icon name="barcode" size={28} />
            <p>No labels yet.</p>
            <button className="btn btn-primary" onClick={() => goTo('generate')}>Create your first label</button>
          </div>
        ) : (
          <ul className="plist">
            {products.map((p) => (
              <li key={p.id} className="prow">
                <div className="prow-main">
                  <div className="prow-name">{p.name || 'No name'}</div>
                  <div className="prow-meta mono">{p.barcode}</div>
                </div>
                <div className="prow-price">{settings.currencySymbol}{Number(p.price).toFixed(2)}</div>
                <div className="prow-type">{p.barcode_type === 'CODE128' ? 'Code 128' : 'EAN-13'}</div>
                <div className="prow-actions">
                  <button className="btn btn-secondary" onClick={() => handleReprint(p)}>
                    <Icon name="printer" size={16} /> Reprint
                  </button>
                  <button className="btn btn-icon" aria-label={`Edit ${p.name || p.barcode}`} onClick={() => setEditing(p)}>
                    <Icon name="edit" size={18} />
                  </button>
                  <button className="btn btn-icon btn-icon-danger" aria-label={`Delete ${p.name || p.barcode}`} onClick={() => handleDelete(p.id)}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <EditProductModal product={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default ProductsPage;
