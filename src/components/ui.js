import React from 'react';

const ICONS = {
  barcode: 'M3 5v14M6 5v14M10 5v14M13 5v14M17 5v14M21 5v14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  design: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  check: 'M20 6 9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
};

export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Switch({ checked, onChange, label, hint }) {
  return (
    <div className="switch-row">
      <div>
        <div className="row-label">{label}</div>
        {hint && <div className="row-hint">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`seg-btn ${String(o.value) === String(value) ? 'is-active' : ''}`}
          aria-pressed={String(o.value) === String(value)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ label, hint, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div className="slider">
      <div className="slider-top">
        <label className="row-label">{label}</label>
        <span className="slider-value">
          {Number(value).toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <div className="row-hint">{hint}</div>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <div className="row-hint">{hint}</div>}
    </div>
  );
}

export function Chip({ tone = 'off', children }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function Notice({ tone = 'warn', children }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'warn' || tone === 'bad' ? 'alert' : 'status'}>
      <Icon name={tone === 'ok' ? 'check' : 'alert'} size={18} />
      <div>{children}</div>
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </header>
  );
}
