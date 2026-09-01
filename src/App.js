import React, { useState, useEffect } from 'react';
import GeneratePage from './pages/GeneratePage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';
import { initStorage } from './db/storage';
import { applyPrinterUUIDs } from './printer/printerService';
import { useSettings } from './context/SettingsContext';
import './App.css';

const NAV_ITEMS = [
  { id: 'generate', label: 'Generate', icon: '⊞' },
  { id: 'products', label: 'Products', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function AppShell() {
  const [page, setPage] = useState('generate');
  const { settings } = useSettings();

  useEffect(() => {
    initStorage().catch((err) => console.error('Storage init failed:', err));
  }, []);

  useEffect(() => {
    applyPrinterUUIDs(settings.printerServiceUUID, settings.printerCharacteristicUUID);
  }, [settings.printerServiceUUID, settings.printerCharacteristicUUID]);

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav__brand">Barcode Tag</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`app-nav__item ${page === item.id ? 'app-nav__item--active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {page === 'generate' && <GeneratePage />}
        {page === 'products' && <ProductsPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  );
}

export default App;
