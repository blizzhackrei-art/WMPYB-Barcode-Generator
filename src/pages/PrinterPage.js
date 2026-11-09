import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { isElectron, isNativePlatform, resolvePlatform, detectOS } from '../platform';
import {
  availableModes,
  effectiveMode,
  modeHint,
  MODE_LABELS,
  isReady,
  scanAndConnect,
  connectDevice,
  disconnect,
  getBtName,
  listAndroidUsb,
  connectAndroidUsb,
  listWindowsPrinters,
  printCanvas,
  sendCommand,
} from '../printer/printerService';
import { drawProductLabel } from '../barcode/drawLabel';
import { Chip, Field, Icon, Notice, PageHead, Segmented, Slider } from '../components/ui';

const TEST_LABEL = { name: 'Test label 48 x 30', price: 99.5, barcode: '5901234123457', barcode_type: 'EAN13' };
const STOCK_PRESETS = [
  { w: 40, h: 30 },
  { w: 48, h: 30 },
  { w: 50, h: 30 },
  { w: 58, h: 40 },
  { w: 60, h: 40 },
];
const XPRINTER = { printerLanguage: 'tspl', printerDpi: 203, labelWidthMM: 48, labelHeightMM: 30, tsplGapMM: 2, tsplDensity: 10, tsplSpeed: 3 };

function Step({ n, title, children }) {
  return (
    <section className="card step">
      <div className="step-num" aria-hidden="true">{n}</div>
      <div className="step-body">
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function PrinterPage() {
  const { settings, updateSettings } = useSettings();
  const set = (k) => (v) => updateSettings({ [k]: v });
  const modes = availableModes(settings);
  const mode = effectiveMode(settings);
  const ready = isReady(settings);
  const isRaw = mode !== 'browser';
  const isTspl = isRaw && settings.printerLanguage === 'tspl';

  const [devices, setDevices] = useState([]);
  const [usbDevices, setUsbDevices] = useState([]);
  const [winPrinters, setWinPrinters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const say = (tone, text) => setMsg({ tone, text });

  useEffect(() => {
    if (mode === 'usb' && isElectron()) {
      listWindowsPrinters().then(setWinPrinters).catch(() => {});
    }
  }, [mode]);

  // ---- Bluetooth
  async function connectBt() {
    setBusy(true);
    setDevices([]);
    say('ok', isNativePlatform() ? 'Scanning for Bluetooth printers...' : 'Choose your printer in the browser window.');
    try {
      const found = await scanAndConnect((d) => setDevices((prev) => (prev.find((x) => x.deviceId === d.deviceId) ? prev : [...prev, d])));
      if (!isNativePlatform() && found[0]) say('ok', `Connected to ${found[0].name || 'printer'}.`);
      else say(found.length ? 'ok' : 'warn', found.length ? 'Pick your printer from the list.' : 'No printers found. Turn the printer on and try again.');
    } catch (err) {
      say('bad', `Could not connect. ${err.message || err}`);
    }
    setBusy(false);
  }

  async function pickBt(d) {
    try {
      await connectDevice(d.deviceId, d.name);
      setDevices([]);
      say('ok', `Connected to ${d.name || 'printer'}.`);
    } catch (err) {
      say('bad', `Could not connect. ${err.message || err}`);
    }
  }

  async function dropBt() {
    await disconnect();
    setDevices([]);
    say('ok', 'Disconnected.');
  }

  // ---- USB (Android APK)
  async function scanUsb() {
    try {
      const list = await listAndroidUsb();
      setUsbDevices(list);
      say(list.length ? 'ok' : 'warn', list.length ? 'Select your printer.' : 'No USB device found. Plug the printer in. Phones and tablets need an OTG cable.');
    } catch (err) {
      say('bad', `USB scan failed. ${err.message || err}`);
    }
  }

  async function pickUsb(d) {
    try {
      const key = await connectAndroidUsb(d);
      updateSettings({ androidUsbDeviceName: key });
      say('ok', 'USB printer selected.');
    } catch (err) {
      say('bad', err.message || String(err));
    }
  }

  // ---- Test and calibrate
  async function testPrint() {
    setBusy(true);
    try {
      const c = document.createElement('canvas');
      await drawProductLabel(c, TEST_LABEL, { ...settings, showProductName: true, showPrice: true, showBarcodeNumber: true, showBorder: true });
      await printCanvas(c, settings, 1);
      say('ok', 'Test label sent. The border should sit just inside the sticker edge.');
    } catch (err) {
      say('bad', `Test print failed. ${err.message || err}`);
    }
    setBusy(false);
  }

  async function detectGap() {
    setBusy(true);
    try {
      await sendCommand('GAPDETECT', settings);
      say('ok', 'Printer is measuring the label gap. It feeds a few labels.');
    } catch (err) {
      say('bad', `Could not send command. ${err.message || err}`);
    }
    setBusy(false);
  }

  let n = 0;

  return (
    <div className="page">
      <PageHead title="Printer setup" sub="Work top to bottom once. Settings are saved on this device.">
        <div className="head-actions">
          <Chip tone={ready ? 'ok' : 'warn'}>{ready ? 'Printer ready' : 'Not ready'}</Chip>
          <button className="btn btn-secondary" onClick={() => { updateSettings(XPRINTER); say('ok', 'XPrinter XP-T271U settings applied: TSPL, 203 dpi, 48 x 30 mm, gap 2 mm.'); }}>
            Use XP-T271U settings
          </button>
        </div>
      </PageHead>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Step n={++n} title="Connect the printer">
        <Field label="This device">
          <Segmented
            label="This device"
            value={settings.printerPlatform}
            onChange={set('printerPlatform')}
            options={[
              { value: 'auto', label: `Auto (${detectOS()})` },
              { value: 'windows', label: 'Windows' },
              { value: 'android', label: 'Android' },
            ]}
          />
        </Field>
        <Field label="Connection" hint={modeHint(settings) || `Options for ${resolvePlatform(settings.printerPlatform)}.`}>
          <Segmented
            label="Connection"
            value={mode}
            onChange={set('connectionMode')}
            options={modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />
        </Field>

        {mode === 'bluetooth' && (
          <div className="panel">
            {ready ? (
              <div className="inline-row">
                <Chip tone="ok">Connected: {getBtName() || 'Printer'}</Chip>
                <button className="btn btn-secondary" onClick={dropBt}>Disconnect</button>
              </div>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={connectBt}>
                {busy ? 'Searching...' : 'Find Bluetooth printer'}
              </button>
            )}
            {devices.length > 0 && !ready && (
              <ul className="dev-list">
                {devices.map((d) => (
                  <li key={d.deviceId}>
                    <span>{d.name || 'Unknown device'}</span>
                    <button className="btn btn-secondary" onClick={() => pickBt(d)}>Connect</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="row-hint">Turn the printer on and keep it close. On first use, allow the Bluetooth permission.</p>
            <details className="adv">
              <summary>Bluetooth service IDs</summary>
              <p className="row-hint">Change only if the default XPrinter values fail. A BLE scanner app like nRF Connect shows the right ones.</p>
              <Field label="Service UUID">
                <input className="mono" value={settings.printerServiceUUID} onChange={(e) => updateSettings({ printerServiceUUID: e.target.value })} />
              </Field>
              <Field label="Characteristic UUID">
                <input className="mono" value={settings.printerCharacteristicUUID} onChange={(e) => updateSettings({ printerCharacteristicUUID: e.target.value })} />
              </Field>
            </details>
          </div>
        )}

        {mode === 'usb' && isNativePlatform() && (
          <div className="panel">
            <div className="inline-row">
              <button className="btn btn-primary" onClick={scanUsb}>Scan USB devices</button>
              {settings.androidUsbDeviceName && <Chip tone="ok">Selected {settings.androidUsbDeviceName}</Chip>}
            </div>
            {usbDevices.length > 0 && (
              <ul className="dev-list">
                {usbDevices.map((d) => (
                  <li key={d.deviceName}>
                    <span>{d.isPrinter ? 'Printer' : 'USB device'} {d.vendorId}:{d.productId}</span>
                    <button className="btn btn-secondary" onClick={() => pickUsb(d)}>Select</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="row-hint">Phones and tablets need an OTG cable. iMin desktop units plug straight into a USB port. Tick Always allow when Android asks.</p>
          </div>
        )}

        {mode === 'usb' && isElectron() && (
          <div className="panel">
            <Field label="Windows printer" hint="Install the printer driver first. It appears here by its Windows name.">
              <div className="inline-row">
                <select value={settings.windowsPrinterName} onChange={(e) => updateSettings({ windowsPrinterName: e.target.value })}>
                  <option value="">Choose a printer</option>
                  {winPrinters.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                  {settings.windowsPrinterName && !winPrinters.find((p) => p.name === settings.windowsPrinterName) && (
                    <option value={settings.windowsPrinterName}>{settings.windowsPrinterName}</option>
                  )}
                </select>
                <button className="btn btn-secondary" onClick={() => listWindowsPrinters().then(setWinPrinters)}>
                  <Icon name="refresh" size={18} /> Refresh
                </button>
              </div>
            </Field>
          </div>
        )}

        {mode === 'lan' && (
          <div className="panel grid-2">
            <Field label="Printer IP address" hint="Same network as this device.">
              <input value={settings.lanHost} placeholder="192.168.1.50" onChange={(e) => updateSettings({ lanHost: e.target.value.trim() })} />
            </Field>
            <Field label="Port" hint="Most label printers use 9100.">
              <input type="number" value={settings.lanPort} onChange={(e) => updateSettings({ lanPort: Number(e.target.value) })} />
            </Field>
          </div>
        )}

        {mode === 'browser' && (
          <div className="panel">
            <p className="row-hint">In the print window set Paper size to your label, Margins to None and Scale to 100%. Turn off Headers and footers.</p>
          </div>
        )}
      </Step>

      {isRaw && (
        <Step n={++n} title="Printer language and sharpness">
          <Field label="Language" hint="Label printers like the XP-T271U understand TSPL. It feeds to the next label correctly. ESC/POS is for receipt printers.">
            <Segmented
              label="Printer language"
              value={settings.printerLanguage}
              onChange={set('printerLanguage')}
              options={[
                { value: 'tspl', label: 'TSPL (labels)' },
                { value: 'escpos', label: 'ESC/POS (receipts)' },
              ]}
            />
          </Field>
          <Field label="Print resolution" hint="XPrinter XP-T271U is 203 dpi. Use 300 only if your printer says 300 dpi.">
            <Segmented
              label="Print resolution"
              value={settings.printerDpi}
              onChange={set('printerDpi')}
              options={[
                { value: 203, label: '203 dpi' },
                { value: 300, label: '300 dpi' },
              ]}
            />
          </Field>
        </Step>
      )}

      <Step n={++n} title="Label stock">
        <div className="chips">
          {STOCK_PRESETS.map((p) => {
            const on = settings.labelWidthMM === p.w && settings.labelHeightMM === p.h;
            return (
              <button key={`${p.w}x${p.h}`} className={`chip chip-btn ${on ? 'chip-ok' : 'chip-off'}`} onClick={() => updateSettings({ labelWidthMM: p.w, labelHeightMM: p.h })}>
                {p.w} x {p.h} mm
              </button>
            );
          })}
        </div>
        <div className={isTspl ? 'grid-3' : 'grid-2'}>
          <Field label="Width (mm)">
            <input type="number" inputMode="decimal" value={settings.labelWidthMM} onChange={(e) => updateSettings({ labelWidthMM: Number(e.target.value) })} />
          </Field>
          <Field label="Height (mm)">
            <input type="number" inputMode="decimal" value={settings.labelHeightMM} onChange={(e) => updateSettings({ labelHeightMM: Number(e.target.value) })} />
          </Field>
          {isTspl && (
            <Field label="Gap between labels (mm)" hint="Check the backing paper. Most are 2 to 3 mm.">
              <input type="number" inputMode="decimal" value={settings.tsplGapMM} onChange={(e) => updateSettings({ tsplGapMM: Number(e.target.value) })} />
            </Field>
          )}
        </div>
      </Step>

      {isTspl && (
        <Step n={++n} title="Print darkness and speed">
          <Slider label="Density" value={settings.tsplDensity} min={1} max={15} step={1} hint="Raise for darker bars. Very high density can smear small text. Adjust Text boldness in Design for faded numbers." onChange={set('tsplDensity')} />
          <Slider label="Speed" value={settings.tsplSpeed} min={1} max={6} step={1} hint="Slower gives darker, sharper print on thermal stickers." onChange={set('tsplSpeed')} />
        </Step>
      )}

      <Step n={++n} title="Test and calibrate">
        <div className="inline-row wrap">
          <button className="btn btn-primary" disabled={busy || !ready} onClick={testPrint}>
            <Icon name="printer" size={18} /> Print test label
          </button>
          {isTspl && (
            <button className="btn btn-secondary" disabled={busy || !ready} onClick={detectGap}>
              Detect label gap
            </button>
          )}
        </div>
        {!ready && <p className="row-hint">Finish step 1 to enable test printing.</p>}
        <p className="row-hint">
          The test label has a border. If it is cut off or shifted, run Detect label gap, then check width, height and gap above. Scan the printed barcode with a scanner and a phone camera before you print a full roll.
        </p>
      </Step>
    </div>
  );
}

export default PrinterPage;
