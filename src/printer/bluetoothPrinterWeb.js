import { chunkBytes } from './escpos';

// Default UUIDs — overridden at runtime via setPrinterUUIDs() from Settings page
let PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
let PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

export function setPrinterUUIDsWeb(serviceUUID, characteristicUUID) {
  PRINTER_SERVICE_UUID = serviceUUID;
  PRINTER_CHARACTERISTIC_UUID = characteristicUUID;
}

let device = null;
let characteristic = null;

export function isWebBluetoothSupported() {
  return !!navigator.bluetooth;
}

export async function connectPrinterWeb() {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth not supported in this browser. Use Chrome or Edge on Android/Windows.');
  }

  device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [PRINTER_SERVICE_UUID] }],
    optionalServices: [PRINTER_SERVICE_UUID],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
  characteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID);

  return device.name;
}

export async function disconnectPrinterWeb() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
  device = null;
  characteristic = null;
}

export function isPrinterConnectedWeb() {
  return !!(device && device.gatt.connected);
}

export async function sendBytesToPrinterWeb(bytes) {
  if (!characteristic) throw new Error('No printer connected.');

  const chunks = chunkBytes(bytes, 180);
  for (const chunk of chunks) {
    await characteristic.writeValueWithoutResponse(chunk);
    await new Promise((res) => setTimeout(res, 20));
  }
}
