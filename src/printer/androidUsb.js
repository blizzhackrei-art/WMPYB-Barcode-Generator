import { registerPlugin } from '@capacitor/core';

// Native plugin: android/.../UsbPrinterPlugin.java (APK only)
const UsbPrinter = registerPlugin('UsbPrinter');

function toBase64(bytes) {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

export async function listUsbDevices() {
  const res = await UsbPrinter.list();
  return res.devices || [];
}

export async function requestUsbPermission(deviceName) {
  const res = await UsbPrinter.requestPermission({ deviceName });
  return !!res.granted;
}

export function writeUsb(deviceName, bytes) {
  return UsbPrinter.write({ deviceName, data: toBase64(bytes) });
}

export function tcpSendAndroid(host, port, bytes) {
  return UsbPrinter.tcpSend({ host, port, data: toBase64(bytes) });
}
