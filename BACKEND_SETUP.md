# Backend API Setup - Gyors Útmutató

## 🚀 Backend Első Indítása

### Lépés 1: Függőségek telepítése
```bash
cd server
npm install
```

### Lépés 2: Adatbázis inicializálása és seed adatok beszúrása
```bash
node seed.js
```

**Létrehozza:**
- SQLite adatbázist (`webshop.db`)
- Admin felhasználót: `admin@webshop.hu` / `admin123`
- Test felhasználót: `testuser@webshop.hu` / `test123`
- 20 minta terméket különféle kategóriákban

### Lépés 3: Fejlesztési szerver indítása
```bash
npm run dev
```

API elérhető: `http://localhost:3001/api`

---

## Frontend Beállítás

### Lépés 1: Függőségek telepítése
```bash
cd my-app
npm install
```

### Lépés 2: Frontend indítása
```bash
npm run dev
```

Frontend elérhető: `http://localhost:5173`

---

## ✅ Funkciók Ellenőrzése

### API Health Check
```bash
curl http://localhost:3001/api/health
```

### Termékek Lekérése
```bash
curl http://localhost:3001/api/products
```

### Bejelentkezés (JWT Token beszerzése)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@webshop.hu","password":"admin123"}'
```

Válasz fog tartalmazni a `token` mezőt.

### Rendelés Létrehozása (Autentikáció szükséges)
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": 1, "quantity": 2}],
    "total_price": 259998,
    "discount_percent": 0,
    "coupon_code": ""
  }'
```

---

## 📁 Backend Szerkezet

```
server/
├── server.js              # Express app entry point
├── database.js           # SQLite inicializáció
├── auth.js               # JWT és password hashing utilitások
├── seed.js               # Adatbázis seed script
├── package.json          # Node.js konfigurációs
├── .env                  # Environment variables
├── .gitignore            # Ignored fájlok
└── routes/
    ├── auth.js           # Autentikáció endpoints
    ├── products.js       # Termék endpoints
    ├── orders.js         # Rendelés endpoints
    └── admin.js          # Admin panel endpoints
```

---

## 🔑 Biztonsági Megjegyzések

1. **JWT Secret**: A `.env` fájlban meg kell változtatni az `JWT_SECRET` értéket éles verzióban
2. **CORS**: Az `CLIENT_URL` a `server.js`-ben beállított `CLIENT_URL` az `.env`-ből
3. **Password Hashing**: bcryptjs 10 iterációval hasheli a jelszavakat
4. **Token Expiry**: JWT token 7 nap múlva lejár

---

## 🐛 Troubleshooting

### "Cannot find module" hiba
```bash
# Telepítse újra az összes függőséget
npm install
```

### "Address already in use" hiba
```bash
# Másik portot használ (PORT=3002 node server.js)
# Vagy kiléptetni az másik processt a 3001-es porton
```

### CORS hiba a frontendről
- Győződjön meg, hogy a backend fut a 3001-es porton
- Ellenőrizze a `server.js`-ben az `/api` prefix-et az útvonalaknak

### Adatbázis korrupciójelenségei
```bash
# Törölje a webshop.db fájlt és futtassa újra:
rm server/webshop.db
node server/seed.js
```

---

## 📊 Adatbázis Táblák

### users
Felhasználók és hitelesítés

### products  
Termékek katalógus

### reviews
Termékértékelések és megjegyzések

### orders
Vásárlói megrendelések

---

## 🔄 API Flow

1. **Regisztráció**: POST `/auth/register` → JWT token
2. **Bejelentkezés**: POST `/auth/login` → JWT token  
3. **Termékek**: GET `/products` (nincs auth szükséges)
4. **Rendelés**: POST `/orders` + token → Rendelés ID
5. **Admin**: Számos `/admin/*` endpoint

---

## 💡 Következő Lépések

- [ ] Frontend App.jsx integrálása az új API-val
- [ ] Login/Register komponensek kezelése
- [ ] Checkout flow implementálása
- [ ] Admin panel UI elkészítése
- [ ] Error handling javítása
- [ ] TypeScript tipusok hozzáadása

