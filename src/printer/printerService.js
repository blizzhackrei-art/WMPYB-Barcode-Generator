import { isNativePlatform, isElectron, resolvePlatform } from '../platform';
import * as nativeBt from './bluetoothPrinter';
import * as webBt from './bluetoothPrinterWeb';
import { listUsbDevices, requestUsbPermission, writeUsb, tcpSendAndroid } from './androidUsb';
import { buildPrintBytes } from './buildJob';
import { browserPrintCanvas } from './browserPrint';

export function applyPrinterUUIDs(serviceUUID, characteristicUUID) {
  nativeBt.setPrinterUUIDsNative(serviceUUID, characteristicUUID);
  webBt.setPrinterUUIDsWeb(serviceUUID, characteristicUUID);
}

function toBase64(bytes) {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

// ---------- Mode resolution ----------

export const MODE_LABELS = {
  bluetooth: 'Bluetooth',
  usb: 'USB',
  lan: 'LAN (TCP 9100)',
  browser: 'Browser / System Print',
};

// Which connection modes work in this environment + chosen platform
export function availableModes(settings) {
  const platform = resolvePlatform(settings.printerPlatform);
  const modes = [];
  if (platform === 'android') {
    modes.push('bluetooth');
    if (isNativePlatform()) modes.push('usb', 'lan'); // needs APK plugin
    modes.push('browser');
  } else {
    // windows / other
    if (isElectron()) modes.push('usb', 'lan');
    modes.push('browser');
    if (!isElectron() && webBt.isWebBluetoothSupported()) modes.push('bluetooth');
  }
  return modes;
}

export function effectiveMode(settings) {
  const modes = availableModes(settings);
  return modes.includes(settings.connectionMode) ? settings.connectionMode : modes[0];
}

// Why a mode is missing, shown in Settings
export function modeHint(settings) {
  const platform = resolvePlatform(settings.printerPlatform);
  if (platform === 'android' && !isNativePlatform()) {
    return 'USB and LAN need the installed APK. Browser/PWA supports Bluetooth and System Print only.';
  }
  if (platform !== 'android' && !isElectron()) {
    return 'Windows USB and LAN need the Windows installer app. Browser supports System Print only.';
  }
  return '';
}

// ---------- Bluetooth ----------

export function printerModeLabel(settings) {
  const mode = effectiveMode(settings);
  if (mode === 'bluetooth') {
    return isNativePlatform() ? 'Bluetooth (native)' : 'Bluetooth (Web Bluetooth)';
  }
  return MODE_LABELS[mode];
}

let btName = '';
export const getBtName = () => btName;

export async function scanAndConnect(onDeviceFound) {
  if (isNativePlatform()) {
    await nativeBt.initBle();
    return nativeBt.scanForPrinters(onDeviceFound);
  }
  const name = await webBt.connectPrinterWeb();
  btName = name || 'Printer';
  return [{ deviceId: 'web', name }];
}

export async function connectDevice(deviceId, name) {
  if (isNativePlatform()) {
    await nativeBt.connectToPrinter(deviceId);
    btName = name || 'Printer';
  }
  return true;
}

export async function disconnect() {
  btName = '';
  if (isNativePlatform()) return nativeBt.disconnectPrinter();
  return webBt.disconnectPrinterWeb();
}

function isBtConnected() {
  return isNativePlatform() ? nativeBt.isPrinterConnected() : webBt.isPrinterConnectedWeb();
}

// ---------- Android USB ----------

export const usbKey = (d) => `${d.vendorId}:${d.productId}`;

export async function listAndroidUsb() {
  return listUsbDevices();
}

export async function connectAndroidUsb(device) {
  const granted = await requestUsbPermission(device.deviceName);
  if (!granted) throw new Error('USB permission denied');
  return usbKey(device);
}

// ---------- Windows (Electron) ----------

export async function listWindowsPrinters() {
  return window.electronPrinter.listPrinters();
}

// ---------- Unified state + print ----------

export function isReady(settings) {
  switch (effectiveMode(settings)) {
    case 'bluetooth':
      return isBtConnected();
    case 'usb':
      return isElectron() ? !!settings.windowsPrinterName : !!settings.androidUsbDeviceName;
    case 'lan':
      return !!settings.lanHost;
    case 'browser':
      return true;
    default:
      return false;
  }
}

export function notReadyMessage(settings) {
  switch (effectiveMode(settings)) {
    case 'bluetooth':
      return 'Connect a Bluetooth printer first.';
    case 'usb':
      return isElectron() ? 'Select a Windows printer in Settings.' : 'Select a USB printer in Settings.';
    case 'lan':
      return 'Enter printer IP in Settings.';
    default:
      return 'Printer not ready.';
  }
}

async function sendRaw(bytes, settings) {
  const mode = effectiveMode(settings);
  if (mode === 'bluetooth') {
    return isNativePlatform() ? nativeBt.sendBytesToPrinter(bytes) : webBt.sendBytesToPrinterWeb(bytes);
  }
  if (mode === 'usb') {
    if (isElectron()) {
      return window.electronPrinter.printRaw(settings.windowsPrinterName, toBase64(bytes));
    }
    const devices = await listUsbDevices();
    const dev = devices.find((d) => usbKey(d) === settings.androidUsbDeviceName);
    if (!dev) throw new Error('USB printer not found. Plug it in and reselect in Settings.');
    if (!(await requestUsbPermission(dev.deviceName))) throw new Error('USB permission denied');
    return writeUsb(dev.deviceName, bytes);
  }
  if (mode === 'lan') {
    const port = Number(settings.lanPort) || 9100;
    if (isElectron()) return window.electronPrinter.printLan(settings.lanHost, port, toBase64(bytes));
    return tcpSendAndroid(settings.lanHost, port, bytes);
  }
  throw new Error('Unsupported mode');
}

export async function printCanvas(canvas, settings, copies = 1) {
  const mode = effectiveMode(settings);
  if (mode === 'browser') {
    return browserPrintCanvas(canvas, settings.labelWidthMM, settings.labelHeightMM);
  }
  if (settings.printerLanguage === 'tspl') {
    return sendRaw(buildPrintBytes(canvas, settings, copies), settings);
  }
  // ESC/POS has no copies command here: repeat the job
  for (let i = 0; i < copies; i++) {
    await sendRaw(buildPrintBytes(canvas, settings, 1), settings);
  }
}

// Raw TSPL text command (for example GAPDETECT). Not for browser mode.
export async function sendCommand(text, settings) {
  if (effectiveMode(settings) === 'browser') throw new Error('Raw commands need Bluetooth, USB or LAN.');
  const bytes = new Uint8Array(Array.from(text + '\r\n').map((c) => c.charCodeAt(0) & 0xff));
  return sendRaw(bytes, settings);
}
