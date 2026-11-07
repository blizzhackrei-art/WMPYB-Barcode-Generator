import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { isElectron, isNativePlatform, resolvePlatform } from '../platform';
import {
  availableModes,
  effectiveMode,
  modeHint,
  MODE_LABELS,
  listAndroidUsb,
  connectAndroidUsb,
  listWindowsPrinters,
} from '../printer/printerService';

const inputStyle = { padding: 8, border: '1px solid var(--color-border)', borderRadius: 6 };

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-row__label">{label}</div>
        {hint && <div className="settings-row__hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function PrinterSettingsCard() {
  const { settings, updateSettings } = useSettings();
  const modes = availableModes(settings);
  const mode = effectiveMode(settings);
  const platform = resolvePlatform(settings.printerPlatform);
  const [usbDevices, setUsbDevices] = useState([]);
  const [winPrinters, setWinPrinters] = useState([]);
  const [msg, setMsg] = useState('');

  async function refreshUsb() {
    try {
      const list = await listAndroidUsb();
      setUsbDevices(list);
      setMsg(list.length ? '' : 'No USB device found. Plug printer, use OTG cable on phones.');
    } catch (err) {
      setMsg('USB scan failed: ' + err.message);
    }
  }

  async function pickUsb(d) {
    try {
      const key = await connectAndroidUsb(d);
      updateSettings({ androidUsbDeviceName: key });
      setMsg(`USB printer selected (${key}).`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function refreshWinPrinters() {
    try {
      setWinPrinters(await listWindowsPrinters());
    } catch (err) {
      setMsg('Printer list failed: ' + err.message);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginTop: 0 }}>Printer Connection</h3>

      <Row label="Device Platform" hint="Auto detects Windows or Android">
        <select
          value={settings.printerPlatform}
          onChange={(e) => updateSettings({ printerPlatform: e.target.value })}
          style={inputStyle}
        >
          <option value="auto">Auto ({resolvePlatform('auto')})</option>
          <option value="windows">Windows</option>
          <option value="android">Android</option>
        </select>
      </Row>

      <Row label="Connection" hint={modeHint(settings) || `Available on ${platform}`}>
        <select
          value={mode}
          onChange={(e) => updateSettings({ connectionMode: e.target.value })}
          style={inputStyle}
        >
          {modes.map((m) => (
            <option key={m} value={m}>{MODE_LABELS[m]}</option>
          ))}
        </select>
      </Row>

      {mode !== 'browser' && (
        <>
          <Row label="Printer Language" hint="XP-T271U supports both. TSPL is faster for labels.">
            <select
              value={settings.printerLanguage}
              onChange={(e) => updateSettings({ printerLanguage: e.target.value })}
              style={inputStyle}
            >
              <option value="escpos">ESC/POS</option>
              <option value="tspl">TSPL</option>
            </select>
          </Row>

          {settings.printerLanguage === 'tspl' && (
            <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Gap (mm)</label>
                <input type="number" value={settings.tsplGapMM} onChange={(e) => updateSettings({ tsplGapMM: Number(e.target.value) })} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Density (0-15)</label>
                <input type="number" min="0" max="15" value={settings.tsplDensity} onChange={(e) => updateSettings({ tsplDensity: Number(e.target.value) })} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Speed (1-6)</label>
                <input type="number" min="1" max="6" value={settings.tsplSpeed} onChange={(e) => updateSettings({ tsplSpeed: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'lan' && (
        <div style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
          <div className="field" style={{ flex: 2, marginBottom: 0 }}>
            <label>Printer IP</label>
            <input value={settings.lanHost} placeholder="192.168.1.50" onChange={(e) => updateSettings({ lanHost: e.target.value.trim() })} />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Port</label>
            <input type="number" value={settings.lanPort} onChange={(e) => updateSettings({ lanPort: Number(e.target.value) })} />
          </div>
        </div>
      )}

      {mode === 'usb' && isElectron() && (
        <div style={{ padding: '12px 0' }}>
          <div className="field">
            <label>Windows Printer (installed driver)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                style={{ ...inputStyle, flex: 1 }}
                value={settings.windowsPrinterName}
                onChange={(e) => updateSettings({ windowsPrinterName: e.target.value })}
              >
                <option value="">Select printer…</option>
                {winPrinters.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
                {settings.windowsPrinterName && !winPrinters.find((p) => p.name === settings.windowsPrinterName) && (
                  <option value={settings.windowsPrinterName}>{settings.windowsPrinterName}</option>
                )}
              </select>
              <button className="btn btn-secondary" type="button" onClick={refreshWinPrinters}>Refresh</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'usb' && isNativePlatform() && (
        <div style={{ padding: '12px 0' }}>
          <button className="btn btn-secondary" type="button" onClick={refreshUsb}>Scan USB devices</button>
          {settings.androidUsbDeviceName && (
            <span style={{ marginLeft: 12, fontSize: '0.85rem' }}>Selected: {settings.androidUsbDeviceName}</span>
          )}
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: 8 }}>
            {usbDevices.map((d) => (
              <li key={d.deviceName} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span>
                  {d.isPrinter ? 'Printer' : 'Device'} {d.vendorId}:{d.productId}
                </span>
                <button className="btn btn-secondary" type="button" onClick={() => pickUsb(d)}>Select</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && <p className="settings-row__hint" style={{ marginTop: 8 }}>{msg}</p>}

      {mode === 'bluetooth' && (
        <div style={{ paddingTop: 12 }}>
          <p className="settings-row__hint" style={{ marginBottom: 12 }}>
            Bluetooth UUIDs. Change only if default XPrinter values fail.
          </p>
          <div className="field">
            <label>Service UUID</label>
            <input value={settings.printerServiceUUID} onChange={(e) => updateSettings({ printerServiceUUID: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Characteristic UUID</label>
            <input value={settings.printerCharacteristicUUID} onChange={(e) => updateSettings({ printerCharacteristicUUID: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

export default PrinterSettingsCard;
