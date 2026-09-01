import React, { createContext, useContext, useState, useEffect } from 'react';

const SETTINGS_KEY = 'barcodeTagAppSettings';

const defaultSettings = {
  showProductName: true,
  showPrice: true,
  labelWidthMM: 48,
  labelHeightMM: 30,
  currencySymbol: '₱',
  printerServiceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
  printerCharacteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
  autoConnectLastPrinter: false,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function resetSettings() {
    setSettings(defaultSettings);
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
