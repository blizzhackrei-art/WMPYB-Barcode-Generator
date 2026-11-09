import React, { createContext, useContext, useState, useEffect } from 'react';

const SETTINGS_KEY = 'barcodeTagAppSettings';

export const defaultSettings = {
  // Label content
  showProductName: true,
  showPrice: true,
  showBarcodeNumber: true,
  showBorder: false,
  currencySymbol: '₱',

  // Label design (sizes in mm)
  labelFont: 'inter', // 'inter' | 'roboto-mono' | 'arial'
  digitsFont: 'inter',
  nameSizeMM: 3.6,
  priceSizeMM: 5.4,
  barcodeHeightMM: 9,
  digitsSizeMM: 3,
  barModule: 'auto', // 'auto' | 2 | 3 | 4 | 5 (dots per narrow bar)
  textBoldness: 1, // extra stroke in dots, fights faded thermal text

  // Preview
  previewSize: 'normal', // 'normal' | 'large'

  // Label stock
  labelWidthMM: 48,
  labelHeightMM: 30,

  // Printer connection
  printerPlatform: 'auto', // 'auto' | 'windows' | 'android'
  connectionMode: 'bluetooth', // 'bluetooth' | 'usb' | 'lan' | 'browser'
  printerLanguage: 'tspl', // 'escpos' | 'tspl'
  printerDpi: 203, // 203 | 300
  tsplGapMM: 2,
  tsplDensity: 10,
  tsplSpeed: 3,
  lanHost: '',
  lanPort: 9100,
  windowsPrinterName: '',
  androidUsbDeviceName: '',
  printerServiceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
  printerCharacteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
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
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage blocked: keep in memory */
    }
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
