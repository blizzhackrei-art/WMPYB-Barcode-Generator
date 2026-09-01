import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

export async function initDatabase() {
  db = await sqlite.createConnection('barcodeapp', false, 'no-encryption', 1, false);
  await db.open();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      barcode TEXT NOT NULL,
      barcode_type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export async function addProduct(name, price, barcode, barcodeType) {
  const result = await db.run(
    `INSERT INTO products (name, price, barcode, barcode_type) VALUES (?, ?, ?, ?)`,
    [name, price, barcode, barcodeType]
  );
  return result;
}

export async function getAllProducts() {
  const result = await db.query(`SELECT * FROM products ORDER BY created_at DESC`);
  return result.values || [];
}

export async function deleteProduct(id) {
  await db.run(`DELETE FROM products WHERE id = ?`, [id]);
}

export async function updateProduct(id, name, price) {
  await db.run(`UPDATE products SET name = ?, price = ? WHERE id = ?`, [name, price, id]);
}
