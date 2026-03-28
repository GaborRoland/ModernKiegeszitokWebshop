# React Webshop - Backend API

## Telepítés és Indítás

### Backend beállítás

#### 1. Függőségek telepítése
```bash
cd server
npm install
```

#### 2. Adatbázis inicializálása
```bash
node seed.js
```

Ez létrehozza a szükséges táblákat és hozzáadja:
- **Admin felhasználó**: `admin` / `admin123`
- **Test felhasználó**: `testuser` / `test123`  
- **20 minta termék** alapértelmezett adatokkal

#### 3. Backend indítása
```bash
npm run dev
```

Az API a `http://localhost:3001/api` címen lesz elérhető.

### Frontend beállítás

#### 1. Függőségek telepítése
```bash
cd my-app
npm install
```

#### 2. Frontend indítása
```bash
npm run dev
```

A frontend a `http://localhost:5173` címen lesz elérhető.

---

## API Útvonalak

### Autentikáció (`/api/auth`)
- **POST** `/register` - Regisztráció
- **POST** `/login` - Bejelentkezés
- **POST** `/verify` - Token ellenőrzés

### Termékek (`/api/products`)
- **GET** `/` - Összes termék lekérése
- **GET** `/:id` - Egy termék lekérése
- **POST** `/:id/reviews` - Értékelés hozzáadása (autentikáció szükséges)
- **GET** `/:id/reviews` - Termék értékeléseit lekérni

### Rendelések (`/api/orders`)
- **POST** `/` - Új rendelés létrehozása (autentikáció szükséges)
- **GET** `/user/:userId` - Felhasználó rendeléseit lekérni
- **GET** `/` - Összes rendelés (admin hozzáférés szükséges)
- **PUT** `/:id/status` - Rendelés státusza frissítése (admin)

### Admin (`/api/admin`)
- **GET** `/users` - Összes felhasználó
- **PUT** `/users/:id/role` - Felhasználó szerepkörének módosítása
- **DELETE** `/users/:id` - Felhasználó törlése
- **GET** `/stats/products` - Termék statisztika
- **GET** `/stats/orders` - Rendelés statisztika
- **GET** `/stats/users` - Felhasználó statisztika
- **GET** `/dashboard/overview` - Teljes rendszer áttekintés

---

## Adatbázis Schema

### users
```
id: INTEGER PRIMARY KEY
username: TEXT UNIQUE
email: TEXT UNIQUE
password_hash: TEXT
role: TEXT (user/admin)
created_at: DATETIME
```

### products
```
id: INTEGER PRIMARY KEY
name: TEXT
description: TEXT
price: INTEGER
images: JSON
rating: REAL
created_at: DATETIME
```

### reviews
```
id: INTEGER PRIMARY KEY
product_id: INTEGER (FK)
user_id: INTEGER (FK)
rating: INTEGER (1-5)
comment: TEXT
created_at: DATETIME
```

### orders
```
id: INTEGER PRIMARY KEY
user_id: INTEGER (FK)
items: JSON
total_price: INTEGER
discount_percent: REAL
coupon_code: TEXT
status: TEXT (pending/shipped/delivered/cancelled)
created_at: DATETIME
```

---

## Environment Variables

A `server/.env` fájlban állítható be:
```
PORT=3001
JWT_SECRET=your-secret-key-change-this-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Fejlesztés

- **Frontend hot reload**: Vite automatikusan frissít
- **Backend hot reload**: Nodemon monitorozza a fájlokat

### JWT Token

- Érvényessége: 7 nap
- Header: `Authorization: Bearer <token>`
- Token tárolás: localStorage (kulcs: `authToken`)

---

## Tesztelés

### cURL parancsok

#### Bejelentkezés
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@webshop.hu","password":"admin123"}'
```

#### Termékek lekérése
```bash
curl http://localhost:3001/api/products
```

#### Új rendelés
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": 1, "quantity": 2}],
    "total_price": 15000
  }'
```

---

## Häufige Probleme

### Adatbázis lezárás hiba
A `seed.js` futtatása után ellenőrizze, hogy a `webshop.db` létrejött-e.

### CORS hiba
Győződjön meg, hogy a `CLIENT_URL` a `.env` fájlban helyesen be van állítva.

### Token lejárt
Jelentkezzen be újra az új token beszerzéséhez.
