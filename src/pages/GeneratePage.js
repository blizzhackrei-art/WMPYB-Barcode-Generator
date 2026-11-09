import React, { useState, useRef } from 'react';
import ProductForm from '../components/ProductForm';
import LabelPreview from '../components/LabelPreview';
import PrintBar from '../components/PrintBar';
import { PageHead } from '../components/ui';
import { addProduct } from '../db/storage';

const SAMPLE = { name: 'Sample product', price: 125, barcode: '5901234123457', barcode_type: 'EAN13' };

function GeneratePage({ goTo }) {
  const [product, setProduct] = useState(null);
  const canvasRef = useRef(null);

  async function handleGenerate(p) {
    setProduct(p);
    try {
      await addProduct(p.name, p.price, p.barcode, p.barcode_type);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  return (
    <div className="page">
      <PageHead title="Create label" sub="Fill in the product, check the sticker, print." />
      <div className="split">
        <ProductForm onGenerate={handleGenerate} />
        <div className="split-side">
          <LabelPreview product={product || SAMPLE} canvasRef={canvasRef} dimmed={!product} />
          {!product && <p className="row-hint center">Sample shown. Create a label to replace it.</p>}
          <PrintBar getCanvas={() => canvasRef.current} hasLabel={!!product} goTo={goTo} />
        </div>
      </div>
    </div>
  );
}

export default GeneratePage;
