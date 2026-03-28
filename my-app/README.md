# Webshop - React + Vite + TypeScript

Modern webshop alkalmazas React, Vite, TypeScript es Tailwind CSS alapon. A projekt kulon frontendbol (`my-app`) es backend API-bol (`../server`) all.

## Fo funkciok

- Kulon Fooldal es Termekek nezet
- Heti akciok es ajanlott termekek blokk a fooldalon
- Termekkartyak kulon oldalon, szurokkel es osszehasonlitassal
- Reszletes termekoldal tobb keppel
- Kosar mennyisegkezelessel es kuponkod tamogatassal
- Bejelentkezes, regisztracio, jelszo visszaallitas
- Jelszo erosseget jelzo UX + Mutat/Rejt gombok auth modalban
- Rendelesi elozmeny
- Dark mode
- Error boundary es skeleton loading
- Footer (gyors linkek, vasarlasi info, kapcsolat, jogi sor)

## Technologiak

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express API (kulon `../server` mappa)
- SQLite
- JWT
- Vitest + Testing Library
- LocalStorage

## Oldalak es nezetek

- Fooldal (`/`): hero, heti akciok, ajanlott termekek, katalogus CTA
- Termekek nezet (`?products=1`): termekkartyak + filter + compare
- Kosar nezet (`?cart=1`): kosar + fizetesi panel
- Termek reszlet (`?product=<id>`): egy termek reszletes oldala

## Auth flow

- Bejelentkezes: email + jelszo
- Regisztracio: felhasznalonev + email + jelszo + megerosites
- Elfelejtett jelszo: kis link a jelszo mezo alatt, kulon visszaallitasi mod
- Modal UX: Esc bezaras, hatterre kattintva bezaras, Enter submit

## Teszt fiokok (seed)

Ha a backendben lefuttatod a seedet (`../server` mappaban: `npm run seed`), az alabbi alap fiokok jonnek letre:

- Admin: `admin@webshop.hu` / `admin123`
- Teszt user: `test@webshop.hu` / `test123`

## Futtatas

### 1. Fuggosegek telepitese

Frontend (my-app):

```bash
npm install
```

Backend (kulon terminalban, a server mappaban):

```bash
cd ..\server
npm install
```

### 2. Backend API inditasa (kulon terminal)

```bash
cd ..\server
npm run dev
```

### 3. Frontend inditasa (masik terminal)

```bash
cd ..\my-app
npm run dev
```

Opcionális frontend env (ha nem localhost API-t hasznalsz):

```bash
# my-app/.env
VITE_API_BASE_URL=https://your-backend-domain/api
```

### 4. Ellenorzes

- Frontend: http://localhost:5173
- Backend health: http://localhost:3001/api/health

## Elo demo deploy (ajanlott)

- Frontend: Vercel (Root Directory: `my-app`, Build: `npm run build`, Output: `dist`)
- Backend: Render (Root Directory: `server`, Build: `npm install`, Start: `npm run start`)

Szukseges env a backenden:

- `JWT_SECRET` = eros, egyedi string
- `CLIENT_URL` = a Vercel frontend URL-je

Szukseges env a frontenden:

- `VITE_API_BASE_URL` = a Render backend URL + `/api`

### 5. Build

```bash
npm run build
```

### 6. Tesztek

```bash
npm test -- --run
```

## NPM scriptek

- `npm run dev` - fejlesztoi szerver inditasa
- `npm run build` - production build keszitese
- `npm run preview` - build elonezet
- `npm run lint` - ESLint
- `npm test` - Vitest

## API (fo endpointok)

Base URL: `http://localhost:3001/api`

- `GET /api/products` - termekek lekerese
- `GET /api/products/:id` - egy termek lekerese
- `POST /api/auth/register` - regisztracio
- `POST /api/auth/login` - bejelentkezes
- `POST /api/auth/reset-password` - jelszo visszaallitas
- `POST /api/auth/verify` - token ellenorzes

## Adattarolas (localStorage)

- `webshop-cart`
- `webshop-user`
- `webshop-favorites`
- `webshop-compare`
- `webshop-orders`
- `webshop-products-reviews`
- `webshop-theme`

## Projekt struktura

```text
my-app/
├── public/
│   ├── manifest.json
│   └── products/
├── src/
│   ├── App.tsx
│   ├── Cart.tsx
│   ├── CartItem.tsx
│   ├── ErrorBoundary.tsx
│   ├── FilterSidebar.tsx
│   ├── ProductCard.tsx
│   ├── ProductCard.test.tsx
│   ├── ProductSkeleton.tsx
│   ├── ThemeContext.tsx
│   ├── apiService.js
│   ├── index.css
│   ├── main.tsx
│   └── service-worker.ts
├── package.json
└── README.md
```

## Allapot

A projekt fejlesztoi/demo webshop. A fo user flow-k mukodnek (fooldal, termekek, kosar, auth), de production szinthez tovabbi fejlesztes ajanlott.

## Tovabbi fejlesztesi otletek

- Stripe vagy mas fizetesi integracio
- Admin dashboard
- Termekkezeles es keszletkezeles
- Deploy, monitoring, CI/CD
- Tobb automata teszt
