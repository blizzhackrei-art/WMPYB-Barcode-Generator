import { Capacitor } from '@capacitor/core';

export function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Electron preload exposes window.electronPrinter
export function isElectron() {
  return typeof window !== 'undefined' && !!window.electronPrinter;
}

// Detect device OS from user agent (works in browser, PWA, APK, Electron)
export function detectOS() {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('windows')) return 'windows';
  return 'other';
}

// Resolve 'auto' to the detected OS
export function resolvePlatform(setting) {
  return setting === 'auto' || !setting ? detectOS() : setting;
}
