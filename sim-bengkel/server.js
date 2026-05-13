const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'simbengkel-ultra-secret-key-2024';
const DB_PATH = './simbengkel.db';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
  stmt.free(); return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('✅ Loaded existing DB');
  } else {
    db = new SQL.Database();
    console.log('✅ Created new DB');
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'pelanggan', vehicle_type TEXT, last_oil_change DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL, stock INTEGER DEFAULT 0, description TEXT, image_url TEXT, brand TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  // TABEL TRANSAKSI DIUPDATE (Tambah kolom delivery_method dan address)
  db.run(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1, total_price INTEGER NOT NULL, status TEXT DEFAULT 'pending', delivery_method TEXT DEFAULT 'pickup', address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  db.run(`CREATE TABLE IF NOT EXISTS queues (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, service_type TEXT NOT NULL, queue_number INTEGER NOT NULL, status TEXT DEFAULT 'menunggu', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  if (!get("SELECT id FROM users WHERE role='admin'")) {
    const hash = bcrypt.hashSync('admin123', 10);
    const now = new Date().toISOString();
    db.run("INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,?,?)", ['Admin SIM-Bengkel','admin@simbengkel.com',hash,'admin',now]);
    console.log('✅ Admin seeded');
  }

  if (!get("SELECT id FROM products LIMIT 1")) {
    const now = new Date().toISOString();
    const P = [
      ['Oli Mesin Fastron Techno 10W-40','Oli Mesin',85000,150,'Oli sintetik penuh performa tinggi.','https://images.unsplash.com/photo-1625047509168-a71c673980b1?w=400&q=80','Pertamina'],
      ['Kampas Rem Depan TDW','Rem',125000,80,'Kampas rem premium daya cengkram tinggi.','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80','TDW'],
      ['Minyak Rem DOT 4 AHM','Rem',45000,200,'Minyak rem titik didih tinggi.','https://images.unsplash.com/photo-1599839619722-39751411ea63?w=400&q=80','AHM'],
      ['Filter Udara K&N Universal','Filter',320000,40,'Filter udara high-performance.','https://images.unsplash.com/photo-1621570275819-aa849e8ce79d?w=400&q=80','K&N'],
      ['Busi NGK Iridium BPR6EIX','Busi',95000,120,'Busi iridium pembakaran sempurna.','https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80','NGK'],
      ['Aki Kering GS Astra MF 35Ah','Aki',650000,30,'Aki maintenance-free.','https://images.unsplash.com/photo-1520113412548-8df0c656c072?w=400&q=80','GS Astra'],
      
      // REVISI PRODUK SESUAI REQUEST
      ['Jok Kulit Sintetis MBtech','Aksesoris',1200000,15,'Pelapis jok mobil bahan kulit sintetis premium MBtech.','https://images.unsplash.com/photo-1605810730456-bc9b0e515fa0?w=400&q=80','MBtech'],
      ['Seat Cover Universal (Kain)','Aksesoris',250000,40,'Sarung pelindung jok mobil universal bahan fabric berkualitas.','https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400&q=80','OtoCover'],
      ['Karpet Dasar Mobil Presisi','Aksesoris',450000,25,'Karpet dasar pelindung lantai kabin mobil, anti air.','https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?w=400&q=80','OtoMat'],
      ['Alarm Mobil & Central Lock','Aksesoris',350000,30,'Sistem keamanan alarm mobil universal dengan remote.','https://images.unsplash.com/photo-1558002038-1055907df827?w=400&q=80','Oem'],
      ['Klakson Keong Waterproof','Aksesoris',185000,50,'Klakson keong suara nyaring elegan, tahan air.','https://images.unsplash.com/photo-1616781297034-03a8ce7af920?w=400&q=80','Denso'],
      ['Lampu LED Headlight H4 Philips','Lampu',450000,30,'Lampu LED putih bersih 6000K, 3x lebih terang.','https://images.unsplash.com/photo-1600863920956-6512140889df?w=400&q=80','Philips'],
      ['Jasa Retrim Setir Kulit Asli','Aksesoris',450000,999,'Jasa pelapisan ulang lingkar kemudi/setir dengan kulit.','https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=400&q=80','Custom'],
      ['Jasa Retrim Doortrim Pintu','Aksesoris',600000,999,'Jasa pelapisan panel pintu mobil agar interior mewah.','https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80','Custom'],
    ];
    for (const p of P) db.run("INSERT INTO products (name,category,price,stock,description,image_url,brand,created_at) VALUES (?,?,?,?,?,?,?,?)", [...p, now]);
    console.log('✅ Products seeded');
  }

  saveDb();
  console.log('✅ Database ready');
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
};

// ─── AUTH & ME ────────────────────────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { name, email, password, vehicle_type } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });
  if (get("SELECT id FROM users WHERE email=?", [email])) return res.status(400).json({ error: 'Email sudah terdaftar' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    run("INSERT INTO users (name,email,password,vehicle_type,created_at) VALUES (?,?,?,?,?)", [name,email,hash,vehicle_type||null,now]);
    const u = get("SELECT * FROM users WHERE email=?", [email]);
    const token = jwt.sign({ id:u.id, email, role:'pelanggan', name }, JWT_SECRET, { expiresIn:'7d' });
    res.json({ token, user:{ id:u.id, name, email, role:'pelanggan' } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const u = get("SELECT * FROM users WHERE email=?", [email]);
  if (!u || !bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Email atau password salah' });
  const token = jwt.sign({ id:u.id, email:u.email, role:u.role, name:u.name }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ token, user:{ id:u.id, name:u.name, email:u.email, role:u.role } });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const u = get("SELECT id,name,email,role,vehicle_type FROM users WHERE id=?", [req.user.id]);
  res.json(u);
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let sql = "SELECT * FROM products WHERE 1=1";
  const p = [];
  if (search) { sql += " AND (name LIKE ? OR description LIKE ?)"; p.push(`%${search}%`,`%${search}%`); }
  if (category) { sql += " AND category=?"; p.push(category); }
  sql += " ORDER BY created_at DESC";
  res.json(all(sql, p));
});

app.post('/api/products', adminMiddleware, (req, res) => {
  const { name, category, price, stock, description, brand, image_url } = req.body;
  try {
    run("INSERT INTO products (name,category,price,stock,description,brand,image_url,created_at) VALUES (?,?,?,?,?,?,?,?)",
      [name,category,+price,+stock||0,description||'',brand||'',image_url||'🔧',new Date().toISOString()]);
    res.json({success:true});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', adminMiddleware, (req, res) => {
  const { name, category, price, stock, description, brand, image_url } = req.body;
  try {
    run("UPDATE products SET name=?,category=?,price=?,stock=?,description=?,brand=?,image_url=? WHERE id=?",
      [name,category,+price,+stock,description||'',brand||'',image_url||'🔧',req.params.id]);
    res.json({success:true});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', adminMiddleware, (req, res) => {
  run("DELETE FROM products WHERE id=?", [req.params.id]); res.json({ success:true });
});

// ─── TRANSACTIONS (UPDATE UNTUK DELIVERY) ─────────────────────────────────────
app.post('/api/transactions', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admin tidak dapat membeli' });
  const { product_id, quantity=1, delivery_method='pickup', address='' } = req.body;
  const prod = get("SELECT * FROM products WHERE id=?", [product_id]);
  if (!prod) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  if (prod.stock < quantity && prod.category !== 'Jasa' && prod.category !== 'Aksesoris') return res.status(400).json({ error: 'Stok habis' });
  
  try {
    const total = prod.price * quantity;
    const now = new Date().toISOString();
    // Insert include delivery_method & address
    run("INSERT INTO transactions (user_id,product_id,quantity,total_price,status,delivery_method,address,created_at) VALUES (?,?,?,?,'Lunas',?,?,?)",
      [req.user.id,product_id,quantity,total,delivery_method,address,now]);
    run("UPDATE products SET stock=stock-? WHERE id=?", [quantity,product_id]);
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/transactions/my', authMiddleware, (req, res) => {
  res.json(all(`SELECT t.*, p.name as product_name, p.category, p.image_url FROM transactions t JOIN products p ON t.product_id=p.id WHERE t.user_id=? ORDER BY t.created_at DESC`, [req.user.id]));
});

app.get('/api/transactions/all', adminMiddleware, (req, res) => {
  res.json(all(`SELECT t.*, p.name as product_name, u.name as user_name, u.email FROM transactions t JOIN products p ON t.product_id=p.id JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC`, []));
});

// ─── CUCI MOBIL QUEUE ─────────────────────────────────────────────────────────
app.post('/api/queues', authMiddleware, (req, res) => {
  const { service_type } = req.body;
  try {
    const today = new Date().toISOString().split('T')[0];
    const countRow = get("SELECT COUNT(*) as c FROM queues WHERE date(created_at) = ?", [today]);
    const queueNumber = (countRow ? countRow.c : 0) + 1;
    run("INSERT INTO queues (user_id, service_type, queue_number, status, created_at) VALUES (?, ?, ?, 'menunggu', ?)", [req.user.id, service_type, queueNumber, new Date().toISOString()]);
    res.json({ success: true, queue: { queue_number: queueNumber } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/queues/my', authMiddleware, (req, res) => {
  res.json(all("SELECT * FROM queues WHERE user_id=? ORDER BY created_at DESC", [req.user.id]));
});

// ─── AI REC & STATS ───────────────────────────────────────────────────────────
app.get('/api/ai/recommendations', authMiddleware, (req, res) => {
  const history = all(`SELECT p.category,p.id as product_id,t.created_at FROM transactions t JOIN products p ON t.product_id=p.id WHERE t.user_id=? ORDER BY t.created_at DESC`, [req.user.id]);
  const recs = [];
  const cats = history.map(h => h.category);
  
  if (!cats.includes('Oli Mesin')) recs.push({ reason: '🔧 Belum ada riwayat ganti oli. Jaga performa mesin Anda!', priority:'high' });
  if (cats.includes('Rem')) recs.push({ reason:'🛑 Pembeli Kampas Rem biasanya butuh Minyak Rem.', priority:'medium' });
  if (history.length === 0) recs.push({ reason:'👋 Selamat datang! Lihat aksesoris interior untuk mempercantik mobil Anda.', priority:'low' });

  const targetCats = [...new Set(recs.map(r => r.category).filter(Boolean))];
  let products = all("SELECT * FROM products ORDER BY id LIMIT 6", []);
  res.json({ recommendations: recs.slice(0,3), products, history_count: history.length });
});

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  res.json({
    customers: get("SELECT COUNT(*) as c FROM users WHERE role='pelanggan'")?.c || 0,
    orders: get("SELECT COUNT(*) as c FROM transactions")?.c || 0,
    revenue: get("SELECT COALESCE(SUM(total_price),0) as r FROM transactions")?.r || 0,
    products: get("SELECT COUNT(*) as c FROM products")?.c || 0,
    low_stock: get("SELECT COUNT(*) as c FROM products WHERE stock<10")?.c || 0,
  });
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
  res.json(all("SELECT id,name,email,role,vehicle_type,created_at FROM users ORDER BY created_at DESC", []));
});

// ─── HTML PAGES ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
[['/login','login'], ['/register','register'], ['/dashboard','dashboard'], ['/admin','admin']].forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file + '.html')));
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SIM-Bengkel Running on Port ${PORT}\n`);
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });