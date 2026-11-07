import React, { useState } from 'react';
import {
  printerModeLabel,
  effectiveMode,
  scanAndConnect,
  connectDevice,
  disconnect,
  isReady,
  notReadyMessage,
  printCanvas,
} from '../printer/printerService';
import { isNativePlatform } from '../platform';
import { useSettings } from '../context/SettingsContext';

function PrinterPanel({ getLabelCanvas }) {
  const { settings } = useSettings();
  const mode = effectiveMode(settings);
  const [connectedName, setConnectedName] = useState('');
  const [status, setStatus] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [devices, setDevices] = useState([]);
  const [copies, setCopies] = useState(1);

  async function handleConnect() {
    setConnecting(true);
    setDevices([]);
    setStatus(isNativePlatform() ? 'Scanning nearby Bluetooth printers…' : 'Opening Bluetooth device picker…');
    try {
      const found = await scanAndConnect((device) => {
        setDevices((prev) => (prev.find((d) => d.deviceId === device.deviceId) ? prev : [...prev, device]));
      });
      if (!isNativePlatform() && found && found[0]) {
        setConnectedName(found[0].name || 'Printer');
        setStatus(`Connected to ${found[0].name || 'printer'}`);
      } else {
        setStatus(found.length ? 'Select a printer below.' : 'No printers found. Power on printer and retry.');
      }
    } catch (err) {
      setStatus('Connect failed: ' + err.message);
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    await disconnect();
    setConnectedName('');
    setDevices([]);
    setStatus('Disconnected.');
  }

  async function handlePrint() {
    if (!isReady(settings)) {
      alert(notReadyMessage(settings));
      return;
    }
    const canvas = getLabelCanvas();
    if (!canvas) {
      alert('No label to print. Generate a label first.');
      return;
    }
    try {
      setStatus('Sending to printer…');
      await printCanvas(canvas, settings, copies);
      setStatus('Print sent.');
    } catch (err) {
      setStatus('Print failed: ' + (err.message || err));
    }
  }

  const ready = isReady(settings);
  const isBt = mode === 'bluetooth';

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>
          <span className={`status-dot ${ready ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
          {ready ? (isBt ? `Connected: ${connectedName || 'Printer'}` : 'Printer ready') : 'Printer not ready'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {printerModeLabel(settings)} · {settings.printerLanguage === 'tspl' ? 'TSPL' : 'ESC/POS'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {isBt && !ready && (
          <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect Bluetooth Printer'}
          </button>
        )}
        {isBt && ready && (
          <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect</button>
        )}
        {ready && (
          <>
            {mode !== 'browser' && (
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
                title="Copies"
                style={{ width: 64, padding: 10, border: '1px solid var(--color-border)', borderRadius: 6 }}
              />
            )}
            <button className="btn btn-primary" onClick={handlePrint}>Print Label</button>
          </>
        )}
        {!isBt && !ready && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{notReadyMessage(settings)}</span>
        )}
      </div>

      {isBt && isNativePlatform() && devices.length > 0 && !ready && (
        <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
          {devices.map((d) => (
            <li key={d.deviceId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>{d.name || 'Unknown device'}</span>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await connectDevice(d.deviceId);
                    setConnectedName(d.name || 'Printer');
                    setStatus(`Connected to ${d.name}`);
                  } catch (err) {
                    setStatus('Connect failed: ' + err.message);
                  }
                }}
              >
                Connect
              </button>
            </li>
          ))}
        </ul>
      )}

      {status && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 10 }}>{status}</p>}
    </div>
  );
}

export default PrinterPanel;
