import React from 'react';
import { useSettings } from '../context/SettingsContext';
import PrinterSettingsCard from '../components/PrinterSettingsCard';

function Toggle({ on, onClick }) {
  return (
    <button className={`toggle ${on ? 'toggle--on' : ''}`} onClick={onClick} type="button">
      <span className="toggle__knob" />
    </button>
  );
}

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="page-title">Settings</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Label Fields</h3>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Product Name</div>
            <div className="settings-row__hint">Show product name on printed label</div>
          </div>
          <Toggle on={settings.showProductName} onClick={() => updateSettings({ showProductName: !settings.showProductName })} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Price</div>
            <div className="settings-row__hint">Show price on printed label</div>
          </div>
          <Toggle on={settings.showPrice} onClick={() => updateSettings({ showPrice: !settings.showPrice })} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Currency Symbol</div>
            <div className="settings-row__hint">Used before price value</div>
          </div>
          <input
            style={{ width: 60, padding: 8, border: '1px solid var(--color-border)', borderRadius: 6 }}
            value={settings.currencySymbol}
            onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Label Size</h3>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Width (mm)</label>
            <input
              type="number"
              value={settings.labelWidthMM}
              onChange={(e) => updateSettings({ labelWidthMM: Number(e.target.value) })}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Height (mm)</label>
            <input
              type="number"
              value={settings.labelHeightMM}
              onChange={(e) => updateSettings({ labelHeightMM: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Label Preview</h3>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Preview Size</div>
            <div className="settings-row__hint">How large the label preview appears on Generate page</div>
          </div>
          <select
            value={settings.previewSize}
            onChange={(e) => updateSettings({ previewSize: e.target.value })}
            style={{ padding: 8, border: '1px solid var(--color-border)', borderRadius: 6 }}
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <PrinterSettingsCard />

      <button className="btn btn-danger" onClick={() => { if (window.confirm('Reset all settings to default?')) resetSettings(); }}>
        Reset to Defaults
      </button>
    </div>
  );
}

export default SettingsPage;
