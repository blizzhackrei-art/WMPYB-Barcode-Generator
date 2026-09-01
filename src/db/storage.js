import { isNativePlatform } from '../platform';
import * as nativeDb from './database';
import * as webDb from './databaseWeb';

let initialized = false;

export async function initStorage() {
  if (isNativePlatform()) {
    await nativeDb.initDatabase();
  }
  initialized = true;
}

export async function addProduct(name, price, barcode, barcodeType) {
  if (isNativePlatform()) {
    return nativeDb.addProduct(name, price, barcode, barcodeType);
  }
  return webDb.addProductWeb(name, price, barcode, barcodeType);
}

export async function getAllProducts() {
  if (isNativePlatform()) {
    return nativeDb.getAllProducts();
  }
  return webDb.getAllProductsWeb();
}

export async function deleteProduct(id) {
  if (isNativePlatform()) {
    return nativeDb.deleteProduct(id);
  }
  return webDb.deleteProductWeb(id);
}

export async function updateProduct(id, name, price) {
  if (isNativePlatform()) {
    return nativeDb.updateProduct(id, name, price);
  }
  return webDb.updateProductWeb(id, name, price);
}

export function isStorageInitialized() {
  return initialized;
}
