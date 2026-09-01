import { BleClient } from '@capacitor-community/bluetooth-le';
import { chunkBytes } from './escpos';

// Default UUIDs — overridden at runtime via setPrinterUUIDsNative() from Settings page
let PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
let PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

export function setPrinterUUIDsNative(serviceUUID, characteristicUUID) {
  PRINTER_SERVICE_UUID = serviceUUID;
  PRINTER_CHARACTERISTIC_UUID = characteristicUUID;
}

let connectedDeviceId = null;

export async function initBle() {
  // androidNeverForLocation avoids requiring ACCESS_FINE_LOCATION on Android 12+
  // when the app doesn't derive physical location from scan results.
  await BleClient.initialize({ androidNeverForLocation: true });
}

export async function scanForPrinters(onFound, timeoutMs = 8000) {
  const devices = [];
  await BleClient.requestLEScan({}, (result) => {
    if (result.device && result.device.name && !devices.find(d => d.deviceId === result.device.deviceId)) {
      devices.push(result.device);
      onFound(result.device);
    }
  });

  return new Promise((resolve) => {
    setTimeout(async () => {
      await BleClient.stopLEScan();
      resolve(devices);
    }, timeoutMs);
  });
}

export async function connectToPrinter(deviceId) {
  await BleClient.connect(deviceId, (disconnectedId) => {
    if (disconnectedId === connectedDeviceId) {
      connectedDeviceId = null;
    }
  });
  connectedDeviceId = deviceId;
}

export async function disconnectPrinter() {
  if (connectedDeviceId) {
    await BleClient.disconnect(connectedDeviceId);
    connectedDeviceId = null;
  }
}

export async function sendBytesToPrinter(bytes) {
  if (!connectedDeviceId) throw new Error('No printer connected.');

  const chunks = chunkBytes(bytes, 180);
  for (const chunk of chunks) {
    const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    await BleClient.write(connectedDeviceId, PRINTER_SERVICE_UUID, PRINTER_CHARACTERISTIC_UUID, dataView);
    // Small delay prevents buffer overflow on some thermal printers
    await new Promise((res) => setTimeout(res, 20));
  }
}

export function isPrinterConnected() {
  return !!connectedDeviceId;
}
