import React, { useState } from 'react';
import {
  printerModeLabel,
  scanAndConnect,
  disconnect,
  isConnected,
  printCanvas,
} from '../printer/printerService';
import { isNativePlatform } from '../platform';

function PrinterPanel({ getLabelCanvas }) {
  const [connectedName, setConnectedName] = useState('');
  const [status, setStatus] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [devices, setDevices] = useState([]);

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
        setStatus(found.length ? 'Select a printer below.' : 'No printers found. Ensure printer is powered on and paired in Bluetooth settings.');
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
    if (!isConnected()) {
      alert('Connect a printer first.');
      return;
    }
    const canvas = getLabelCanvas();
    if (!canvas) {
      alert('No label to print. Generate a label first.');
      return;
    }
    try {
      setStatus('Sending to printer…');
      await printCanvas(canvas);
      setStatus('Print sent successfully.');
    } catch (err) {
      setStatus('Print failed: ' + err.message);
    }
  }

  const connected = isConnected() || !!connectedName;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>
            <span className={`status-dot ${connected ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
            {connected ? `Connected: ${connectedName || 'Printer'}` : 'Printer not connected'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Mode: {printerModeLabel()}
          </div>
        </div>
      </div>

      {connected ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect</button>
          <button className="btn btn-primary" onClick={handlePrint}>Print Label</button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
          {connecting ? 'Connecting…' : 'Connect Bluetooth Printer'}
        </button>
      )}

      {isNativePlatform() && devices.length > 0 && !connected && (
        <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
          {devices.map((d) => (
            <li key={d.deviceId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>{d.name || 'Unknown device'}</span>
              <button className="btn btn-secondary" onClick={async () => {
                const { connectDevice } = await import('../printer/printerService');
                await connectDevice(d.deviceId);
                setConnectedName(d.name || 'Printer');
                setStatus(`Connected to ${d.name}`);
              }}>Connect</button>
            </li>
          ))}
        </ul>
      )}

      {status && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 10 }}>{status}</p>}

      {!isNativePlatform() && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 10 }}>
          Requires Chrome or Edge. On Android, use the installed app (not browser tab) for best Bluetooth reliability.
        </p>
      )}
    </div>
  );
}

export default PrinterPanel;
