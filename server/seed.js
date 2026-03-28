import { initializeDatabase } from './database.js';
import { hashPassword } from './auth.js';

const SAMPLE_PRODUCTS = [
  {
    name: 'Prémium Laptop',
    description: 'Erőteljes feldolgozóval és hosszú akkumulátor-időtartammal rendelkező laptop',
    price: 129999,
    images: ['laptop1.jpg', 'laptop2.jpg'],
    rating: 4.5
  },
  {
    name: 'Wireless Fülhallgató',
    description: 'Zajzáró technológiával és 30 órás akkumulátor-időtartammal',
    price: 24999,
    images: ['headphones.jpg'],
    rating: 4.8
  },
  {
    name: 'Okos Óra',
    description: 'Fitnesz szenzorral és vízálló design-nal',
    price: 49999,
    images: ['smartwatch.jpg'],
    rating: 4.2
  },
  {
    name: '4K Webkamera',
    description: 'Ultra HD felbontás és automatikus fókuszálás',
    price: 34999,
    images: ['webcam.jpg'],
    rating: 4.6
  },
  {
    name: 'Mechanikus Billentyűzet',
    description: 'RGB háttérvilágítás ésCustomizable gombok',
    price: 19999,
    images: ['keyboard.jpg'],
    rating: 4.7
  },
  {
    name: 'Gaming Egér',
    description: '16000 DPI és ergonomikus design',
    price: 12999,
    images: ['mouse.jpg'],
    rating: 4.4
  },
  {
    name: 'Külső SSD 1TB',
    description: 'Gyors sebességű Thunderbolt csatlakozás',
    price: 34999,
    images: ['ssd.jpg'],
    rating: 4.5
  },
  {
    name: 'Hordozható Töltő',
    description: '20000 mAh kapacitás és gyors töltés',
    price: 8999,
    images: ['powerbank.jpg'],
    rating: 4.3
  },
  {
    name: 'Monitor 27" 144Hz',
    description: 'Gaming monitor magas frissítési sebességgel',
    price: 64999,
    images: ['monitor.jpg'],
    rating: 4.6
  },
  {
    name: 'USB-C Kábel 2m',
    description: 'Gyors adatátvitel és töltés',
    price: 2999,
    images: ['cable.jpg'],
    rating: 4.2
  },
  {
    name: 'LED Asztal Lámpa',
    description: 'Állítható fényerősség és szín hőmérséklet',
    price: 9999,
    images: ['lamp.jpg'],
    rating: 4.1
  },
  {
    name: 'Nyak Masszírozó',
    description: 'Hőfunkció és több intenzitási szint',
    price: 14999,
    images: ['massager.jpg'],
    rating: 4.5
  },
  {
    name: 'Asztali Mikrofon',
    description: 'Stúdió minőségű felvétel 40Hz-20kHz tartományban',
    price: 44999,
    images: ['microphone.jpg'],
    rating: 4.7
  },
  {
    name: 'Document Scanner',
    description: 'Szkennelje be dokumentumait vezeték nélkül',
    price: 54999,
    images: ['scanner.jpg'],
    rating: 4.4
  },
  {
    name: 'WiFi-es Okos Izzó',
    description: '16 millió szín és hangvezérlés',
    price: 3999,
    images: ['bulb.jpg'],
    rating: 4.2
  },
  {
    name: 'Laptop Hűtő Pad',
    description: 'Aktiválva 5 ventilátor és -10°C hűtés',
    price: 7999,
    images: ['cooler.jpg'],
    rating: 4.3
  },
  {
    name: 'Bluetooth Beszélő',
    description: '360° hangzás és 20 órás akkumulátor',
    price: 19999,
    images: ['speaker.jpg'],
    rating: 4.6
  },
  {
    name: 'Laptop Hátizsák',
    description: 'USB töltési port és vízálló anyag',
    price: 12999,
    images: ['backpack.jpg'],
    rating: 4.5
  },
  {
    name: 'Egér Pad',
    description: 'XXL méret és ergonomikus alap',
    price: 4999,
    images: ['mousepad.jpg'],
    rating: 4.1
  },
  {
    name: 'USB Hub 7 Port',
    description: 'Gyors USB 3.1 és 5V/2A tápellátás',
    price: 8999,
    images: ['hub.jpg'],
    rating: 4.4
  }
];

const seedDatabase = () => {
  const db = initializeDatabase();

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

  db.close((err) => {
    if (err) {
      console.error('Adatbázis lezárása sikertelen:', err);
    } else {
      console.log('✅ Adatbázis lezárva. Seed befejezve!');
    }
  });
};

seedDatabase();
