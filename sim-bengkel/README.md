# 🚗 SIM-Bengkel — Automotive Spare Parts E-Commerce

Platform e-commerce suku cadang otomotif dengan **AI Recommendation Engine**.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server
node server.js

# 3. Buka browser
open http://localhost:3000
```

## 🔑 Akun Demo

| Role  | Email | Password |
|-------|-------|----------|
| Admin | admin@simbengkel.com | admin123 |
| Pelanggan | Daftar baru di /register | — |

## 📁 Struktur Proyek

```
sim-bengkel/
├── server.js          # Express + sql.js backend
├── package.json
├── simbengkel.db      # SQLite DB (auto-created)
└── public/
    ├── index.html     # Katalog produk publik
    ├── login.html     # Halaman login
    ├── register.html  # Halaman registrasi
    ├── dashboard.html # Dashboard pelanggan + AI
    └── admin.html     # Admin panel
```

## 🤖 AI Recommendation Rules

1. **Oil Schedule** — Ingatkan ganti oli setiap 90 hari
2. **Market Basket** — Beli Kampas Rem → Saran Minyak Rem
3. **Bundle Logic** — Ganti Oli → Saran Filter juga
4. **New User** — Tampilkan produk terlaris untuk user baru

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS CDN, Vanilla JS
- **Backend**: Node.js + Express.js
- **Database**: sql.js (SQLite pure JS — zero native build!)
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcryptjs
