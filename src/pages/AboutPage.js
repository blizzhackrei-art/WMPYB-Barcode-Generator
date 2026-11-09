import React from 'react';
import { PageHead, Notice } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { isElectron, isNativePlatform, detectOS } from '../platform';

export const APP_VERSION = '1.1.0';

function AboutPage() {
  const { resetSettings } = useSettings();
  const runningAs = isElectron() ? 'Windows app' : isNativePlatform() ? 'Android app' : 'Web app (PWA)';

  return (
    <div className="page page-narrow">
      <PageHead title="About" sub="Barcode Generator for price tags and product labels." />

      <section className="card">
        <h2 className="card-title">Developer</h2>
        <p className="about-credit">
          This app is created by Aries Aguilar of HVAA Computer Trading. For inquiries, please contact at{' '}
          <a href="https://m.me/vanerie25" target="_blank" rel="noopener noreferrer">https://m.me/vanerie25</a>
        </p>
      </section>

      <section className="card">
        <h2 className="card-title">This installation</h2>
        <dl className="facts">
          <div><dt>Version</dt><dd>{APP_VERSION}</dd></div>
          <div><dt>Running as</dt><dd>{runningAs}</dd></div>
          <div><dt>Device</dt><dd>{detectOS()}</dd></div>
          <div><dt>Barcodes</dt><dd>EAN-13, Code 128</dd></div>
          <div><dt>Printers</dt><dd>TSPL and ESC/POS, Bluetooth, USB, LAN, system print</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2 className="card-title">Reset</h2>
        <p className="row-hint">Puts design and printer settings back to defaults. Saved products stay.</p>
        <Notice tone="warn">You will need to reconnect your printer afterwards.</Notice>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm('Reset all settings to default?')) resetSettings();
          }}
        >
          Reset settings
        </button>
      </section>
    </div>
  );
}

export default AboutPage;
