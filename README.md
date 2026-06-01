# 🚗 Smart Garage System (SIM-Bengkel)

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![AI](https://img.shields.io/badge/AI_Powered-Groq_Llama_3.1-orange?style=for-the-badge)

**Smart Garage System (Mandiri Variasi)** adalah platform manajemen layanan bengkel dan e-commerce suku cadang otomotif berbasis *website*. Sistem ini mengubah operasional konvensional menjadi digital dan terstruktur, mengintegrasikan fitur *online booking*, pelacakan transaksi, manajemen inventaris, dan inovasi **Kecerdasan Buatan (AI)** sebagai mekanik virtual.

---

## 👥 Tim Pengembang (Kelompok 1 - Paralel 4)
Proyek ini dikembangkan untuk memenuhi Tugas Akhir Mata Kuliah Rekayasa Perangkat Lunak (RPL), Program Studi Kecerdasan Buatan, Institut Pertanian Bogor.

| Nama Lengkap | NIM | Role / Kontribusi |
| :--- | :--- | :--- |
| **Razka Rafa Ramadhan** | `M0405241002` | *Fullstack & System Analyst* |
| **Dennise Patricia Ibrahim** | `M0405241003` | *Frontend & UI/UX Designer* |
| **Fatimah Nur Abdillah** | `M0405241004` | *Backend, AI Integration, & QA* |

---

## ✨ Fitur Utama
1. **🔐 Autentikasi Aman:** Registrasi dan login pengguna dengan sistem keamanan *JSON Web Token (JWT)* dan enkripsi sandi *bcrypt*.
2. **📦 Manajemen Inventori Cerdas:** Admin dapat mengelola suku cadang secara dinamis, termasuk fitur *upload* gambar berbasis konversi *Base64* (tanpa *storage bucket* tambahan).
3. **🛒 Transaksi & Bulk Checkout:** Pelanggan dapat memasukkan banyak barang ke keranjang, melakukan *checkout* secara bersamaan (nota gabungan), dan mengunggah bukti transfer fisik.
4. **📅 Tiket Booking Servis:** Sistem penjadwalan antrean bengkel yang transparan dan dapat dipantau *real-time*.
5. **🤖 AI Virtual Mechanic:** Integrasi *Large Language Model* (Llama-3.1 via Groq API) untuk memberikan diagnosis kerusakan kendaraan, prioritas perbaikan, dan rekomendasi suku cadang secara otomatis.
6. **📊 Dashboard Admin Real-Time:** Agregasi data pelanggan, total pendapatan, dan riwayat transaksi untuk analisis manajerial.

---

## 🏗️ Arsitektur & Teknologi

Proyek ini menggunakan arsitektur berbasis *Client-Server* terpusat (RESTful API):
* **Presentation Layer (Frontend):** Vanilla JavaScript, HTML5 Murni, dan Tailwind CSS (via CDN) untuk performa ringan dan rendering responsif.
* **Business Logic Layer (Backend):** Node.js dengan framework Express.js (`server.js`).
* **Data Access Layer (Database):** Supabase (PostgreSQL *Cloud*) untuk penyimpanan data persisten dan terelasi.
* **AI Service Layer:** Komunikasi asinkronus ke Groq API (*endpoint* Chat Completions).

---

## 🔄 Metode Pengembangan (SDLC)
Pengembangan sistem ini mengadopsi model *Software Development Life Cycle* (SDLC) terstruktur yang terdiri dari:
1. **Requirement Gathering and Analysis:** Menganalisis masalah antrean konvensional bengkel dan pencatatan manual.
2. **Design:** Pembuatan *Wireframe*, UI/UX *Mockup*, dan perancangan *Entity Relationship Diagram* (ERD).
3. **Implementation:** Penulisan kode untuk modul *Auth, Sparepart, Transaction, Queues*, dan *AI Recommendation*.
4. **Integration and Testing:** Pengujian *Black-box* untuk memastikan tidak ada *bug* saat perpindahan modul (seperti *checkout* ke pembaruan stok).
5. **Deployment:** Peluncuran aplikasi ke lingkungan *cloud hosting* publik (Railway).

---

