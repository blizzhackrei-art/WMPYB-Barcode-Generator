import { isNativePlatform } from '../platform';
import * as nativeBt from './bluetoothPrinter';
import * as webBt from './bluetoothPrinterWeb';
import { canvasToEscPos } from './escpos';

export function applyPrinterUUIDs(serviceUUID, characteristicUUID) {
  nativeBt.setPrinterUUIDsNative(serviceUUID, characteristicUUID);
  webBt.setPrinterUUIDsWeb(serviceUUID, characteristicUUID);
}

// On native Android (APK), Capacitor BLE plugin handles permissions + connection.
// On browser (PWA), Web Bluetooth API handles it — Chrome/Edge on Android and Windows only.

export function printerModeLabel() {
  if (isNativePlatform()) return 'Native Bluetooth (Capacitor)';
  if (webBt.isWebBluetoothSupported()) return 'Web Bluetooth';
  return 'Unsupported';
}

export async function scanAndConnect(onDeviceFound) {
  if (isNativePlatform()) {
    await nativeBt.initBle();
    const devices = await nativeBt.scanForPrinters(onDeviceFound);
    return devices;
  }
  // Web Bluetooth shows its own native device picker — no manual scan list needed
  const name = await webBt.connectPrinterWeb();
  return [{ deviceId: 'web', name }];
}

export async function connectDevice(deviceId) {
  if (isNativePlatform()) {
    return nativeBt.connectToPrinter(deviceId);
  }
  // Web Bluetooth already connects during requestDevice picker step
  return true;
}

export async function disconnect() {
  if (isNativePlatform()) {
    return nativeBt.disconnectPrinter();
  }
  return webBt.disconnectPrinterWeb();
}

export function isConnected() {
  if (isNativePlatform()) {
    return nativeBt.isPrinterConnected();
  }
  return webBt.isPrinterConnectedWeb();
}

export async function printCanvas(canvas) {
  const bytes = canvasToEscPos(canvas);
  if (isNativePlatform()) {
    return nativeBt.sendBytesToPrinter(bytes);
  }
  return webBt.sendBytesToPrinterWeb(bytes);
}
