import React, { useState, useRef } from 'react';
import ProductForm from '../components/ProductForm';
import LabelPreview from '../components/LabelPreview';
import PrinterPanel from '../components/PrinterPanel';
import { addProduct } from '../db/storage';

function GeneratePage() {
  const [product, setProduct] = useState(null);
  const labelCanvasRef = useRef(null);

  function getLabelCanvas() {
    return labelCanvasRef.current;
  }

  async function handleGenerate(newProduct) {
    setProduct(newProduct);
    try {
      await addProduct(newProduct.name, newProduct.price, newProduct.barcode, newProduct.barcode_type);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  return (
    <div>
      <h1 className="page-title">Generate Label</h1>
      <div className="generate-layout" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <ProductForm onGenerate={handleGenerate} />
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <h3 style={{ marginTop: 0 }}>Preview</h3>
          {product ? (
            <LabelPreview product={product} canvasRef={labelCanvasRef} />
          ) : (
            <div className="card" style={{ color: 'var(--color-text-muted)' }}>
              Fill form and click "Generate Label" to preview.
            </div>
          )}

          <PrinterPanel getLabelCanvas={getLabelCanvas} />
        </div>
      </div>
    </div>
  );
}

export default GeneratePage;
