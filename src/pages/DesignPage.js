import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import LabelPreview from '../components/LabelPreview';
import { Field, PageHead, Segmented, Slider, Switch } from '../components/ui';
import { FONT_OPTIONS } from '../barcode/drawLabel';

function DesignPage() {
  const { settings, updateSettings } = useSettings();
  const [sampleName, setSampleName] = useState('Colorful SL300 SSD 256GB');
  const [samplePrice, setSamplePrice] = useState('2500');
  const set = (k) => (v) => updateSettings({ [k]: v });

  const sample = {
    name: sampleName,
    price: parseFloat(samplePrice) || 0,
    barcode: '6971043070098',
    barcode_type: 'EAN13',
  };

  return (
    <div className="page">
      <PageHead title="Label design" sub="Changes show on the sticker right away. Sizes are real millimetres." />
      <div className="split split-design">
        <div className="stack">
          <section className="card">
            <h2 className="card-title">On the label</h2>
            <Switch label="Product name" checked={settings.showProductName} onChange={set('showProductName')} />
            <Switch label="Price" checked={settings.showPrice} onChange={set('showPrice')} />
            <Switch label="Barcode number below bars" checked={settings.showBarcodeNumber} onChange={set('showBarcodeNumber')} />
            <Switch label="Border" checked={settings.showBorder} onChange={set('showBorder')} />
            <Field label="Currency symbol">
              <input className="narrow" value={settings.currencySymbol} onChange={(e) => updateSettings({ currencySymbol: e.target.value })} />
            </Field>
          </section>

          <section className="card">
            <h2 className="card-title">Sizes</h2>
            <Slider label="Product name" value={settings.nameSizeMM} min={2} max={7} step={0.1} unit=" mm" onChange={set('nameSizeMM')} />
            <Slider label="Price" value={settings.priceSizeMM} min={2.5} max={10} step={0.1} unit=" mm" onChange={set('priceSizeMM')} />
            <Slider label="Barcode height" value={settings.barcodeHeightMM} min={5} max={22} step={0.5} unit=" mm" onChange={set('barcodeHeightMM')} />
            <Slider label="Barcode number" value={settings.digitsSizeMM} min={2} max={5} step={0.1} unit=" mm" onChange={set('digitsSizeMM')} />
            <div className="field">
              <label>Bar width</label>
              <Segmented
                label="Bar width"
                value={settings.barModule}
                onChange={set('barModule')}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 2, label: '2 dots' },
                  { value: 3, label: '3 dots' },
                  { value: 4, label: '4 dots' },
                ]}
              />
              <div className="row-hint">Auto picks the widest bars that fit. 3 dots (0.37 mm) scans best on 203 dpi printers.</div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Fonts and print weight</h2>
            <div className="grid-2">
              <Field label="Name and price font">
                <select value={settings.labelFont} onChange={(e) => updateSettings({ labelFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
              <Field label="Barcode number font">
                <select value={settings.digitsFont} onChange={(e) => updateSettings({ digitsFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
            </div>
            <Slider
              label="Text boldness"
              value={settings.textBoldness}
              min={0}
              max={3}
              step={0.5}
              unit=" dots"
              hint="Raise this if numbers or text print faded. Bars are never affected."
              onChange={set('textBoldness')}
            />
          </section>
        </div>

        <div className="split-side sticky">
          <LabelPreview product={sample} />
          <section className="card">
            <h2 className="card-title">Preview</h2>
            <div className="grid-2">
              <Field label="Sample name">
                <input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
              </Field>
              <Field label="Sample price">
                <input type="number" inputMode="decimal" value={samplePrice} onChange={(e) => setSamplePrice(e.target.value)} />
              </Field>
            </div>
            <Field label="Preview size">
              <Segmented
                label="Preview size"
                value={settings.previewSize}
                onChange={set('previewSize')}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'large', label: 'Large' },
                ]}
              />
            </Field>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DesignPage;
