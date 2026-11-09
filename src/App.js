import React, { useState, useEffect } from 'react';
import GeneratePage from './pages/GeneratePage';
import ProductsPage from './pages/ProductsPage';
import DesignPage from './pages/DesignPage';
import PrinterPage from './pages/PrinterPage';
import AboutPage from './pages/AboutPage';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { initStorage } from './db/storage';
import { applyPrinterUUIDs } from './printer/printerService';
import { loadLabelFonts } from './barcode/drawLabel';
import { Icon } from './components/ui';
import './App.css';

const NAV = [
  { id: 'generate', label: 'Create', icon: 'barcode' },
  { id: 'products', label: 'Products', icon: 'list' },
  { id: 'design', label: 'Design', icon: 'design' },
  { id: 'printer', label: 'Printer', icon: 'printer' },
  { id: 'about', label: 'About', icon: 'info' },
];

function AppShell() {
  const [page, setPage] = useState('generate');
  const { settings } = useSettings();

  useEffect(() => {
    initStorage().catch((err) => console.error('Storage init failed:', err));
    loadLabelFonts();
  }, []);

  useEffect(() => {
    applyPrinterUUIDs(settings.printerServiceUUID, settings.printerCharacteristicUUID);
  }, [settings.printerServiceUUID, settings.printerCharacteristicUUID]);

  useEffect(() => {
    const main = document.querySelector('.main');
    if (main) main.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><Icon name="barcode" size={18} /></span>
          <span className="brand-name">Barcode Generator</span>
        </div>
        <div className="rail-items">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`rail-item ${page === item.id ? 'is-active' : ''}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button className="rail-credit" onClick={() => setPage('about')}>
          Created by Aries Aguilar
          <br />
          HVAA Computer Trading
        </button>
      </nav>

      <main className="main">
        {page === 'generate' && <GeneratePage goTo={setPage} />}
        {page === 'products' && <ProductsPage goTo={setPage} />}
        {page === 'design' && <DesignPage />}
        {page === 'printer' && <PrinterPage />}
        {page === 'about' && <AboutPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  );
}
