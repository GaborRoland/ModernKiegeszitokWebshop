import { initializeDatabase } from './database.js';
import { hashPassword } from './auth.js';
import { SAMPLE_PRODUCTS } from './sampleData.js';
export const seedDatabase = (db, options = {}) => {
  const { closeWhenDone = false } = options;

  // Admin felhasználó hozzáadása
  const adminPassword = hashPassword('admin123');
  db.run(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['admin', 'admin@webshop.hu', adminPassword, 'admin'],
    (err) => {
      if (err) {
        console.error('Admin felhasználó hozzáadása sikertelen:', err);
      } else {
        console.log('✅ Admin felhasználó hozzáadva');
      }
    }
  );

  // Test felhasználó hozzáadása
  const testPassword = hashPassword('test123');
  db.run(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['testuser', 'test@webshop.hu', testPassword, 'user'],
    (err) => {
      if (err) {
        console.error('Test felhasználó hozzáadása sikertelen:', err);
      } else {
        console.log('✅ Test felhasználó hozzáadva');
      }
    }
  );

  // Termékek hozzáadása
  SAMPLE_PRODUCTS.forEach((product) => {
    db.run(
      'INSERT OR IGNORE INTO products (name, description, price, images, rating) VALUES (?, ?, ?, ?, ?)',
      [product.name, product.description, product.price, JSON.stringify(product.images), product.rating],
      (err) => {
        if (err) {
          console.error(`Termék hozzáadása sikertelen: ${product.name}`);
        }
      }
    );
  });

  console.log('✅ Termékek hozzáadva az adatbázishoz');

  if (closeWhenDone) {
    db.close((err) => {
      if (err) {
        console.error('Adatbázis lezárása sikertelen:', err);
      } else {
        console.log('✅ Adatbázis lezárva. Seed befejezve!');
      }
    });
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const db = initializeDatabase();
  seedDatabase(db, { closeWhenDone: true });
}
