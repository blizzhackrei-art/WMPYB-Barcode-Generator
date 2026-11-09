import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  effectiveMode,
  isReady,
  notReadyMessage,
  printCanvas,
  printerModeLabel,
  getBtName,
  MODE_LABELS,
} from '../printer/printerService';
import { Chip, Icon, Notice } from './ui';

function PrintBar({ getCanvas, hasLabel, goTo }) {
  const { settings } = useSettings();
  const [copies, setCopies] = useState(1);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const mode = effectiveMode(settings);
  const ready = isReady(settings);
  const where = mode === 'bluetooth' && getBtName() ? getBtName() : printerModeLabel(settings);

  async function handlePrint() {
    setStatus(null);
    const canvas = getCanvas();
    if (!canvas || !hasLabel) return setStatus({ tone: 'warn', text: 'Create a label first.' });
    setBusy(true);
    try {
      await printCanvas(canvas, settings, copies);
      setStatus({ tone: 'ok', text: 'Sent to printer.' });
    } catch (err) {
      setStatus({ tone: 'bad', text: `Print failed. ${err.message || err}` });
    }
    setBusy(false);
  }

  return (
    <div className="card printbar">
      <div className="printbar-top">
        <div>
          <div className="row-label">Printer</div>
          <div className="printbar-chips">
            <Chip tone={ready ? 'ok' : 'warn'}>{ready ? `Ready: ${where}` : 'Not ready'}</Chip>
            <Chip tone="off">{mode === 'browser' ? MODE_LABELS.browser : settings.printerLanguage === 'tspl' ? 'TSPL' : 'ESC/POS'}</Chip>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => goTo('printer')}>
          <Icon name="printer" size={18} /> Printer setup
        </button>
      </div>

      <div className="printbar-actions">
        {mode !== 'browser' && (
          <div className="stepper" aria-label="Copies">
            <button type="button" aria-label="Fewer copies" onClick={() => setCopies(Math.max(1, copies - 1))}>
              <Icon name="minus" size={16} />
            </button>
            <input
              type="number"
              min="1"
              value={copies}
              aria-label="Copies"
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
            />
            <button type="button" aria-label="More copies" onClick={() => setCopies(copies + 1)}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary btn-grow"
          disabled={busy || !hasLabel}
          onClick={ready ? handlePrint : () => goTo('printer')}
        >
          {ready ? (busy ? 'Printing...' : copies > 1 ? `Print ${copies} labels` : 'Print label') : 'Set up printer'}
        </button>
      </div>

      {!ready && <p className="row-hint">{notReadyMessage(settings)}</p>}
      {status && <Notice tone={status.tone}>{status.text}</Notice>}
    </div>
  );
}

export default PrintBar;
