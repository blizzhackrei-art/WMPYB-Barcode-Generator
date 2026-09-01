import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'barcodeTagApp',
  storeName: 'products',
});

// Each product: { id, name, price, barcode, barcode_type, created_at }

export async function addProductWeb(name, price, barcode, barcodeType) {
  const id = Date.now();
  const product = {
    id,
    name,
    price,
    barcode,
    barcode_type: barcodeType,
    created_at: new Date().toISOString(),
  };
  await store.setItem(String(id), product);
  return product;
}

export async function getAllProductsWeb() {
  const products = [];
  await store.iterate((value) => {
    products.push(value);
  });
  return products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function deleteProductWeb(id) {
  await store.removeItem(String(id));
}

export async function updateProductWeb(id, name, price) {
  const existing = await store.getItem(String(id));
  if (existing) {
    existing.name = name;
    existing.price = price;
    await store.setItem(String(id), existing);
  }
}
