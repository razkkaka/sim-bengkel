require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'mandirivariasi-ultra-secret-key-2024';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
};

// AUTO SEED ADMIN & PRODUK (Diperbarui dengan pelacakan Error)
async function initDb() {
  try {
    const { data: adminExists, error: adminErr } = await supabase.from('users').select('id').eq('email', 'sofiemandiri@gmail.com').maybeSingle();
    if (adminErr) console.error("⚠️ Error Cek Admin:", adminErr);

    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 10);
      await supabase.from('users').insert([{ name: 'Admin Mandiri Variasi', email: 'sofiemandiri@gmail.com', password: hash, role: 'admin' }]);
      console.log("✅ Admin berhasil dibuat!");
    }

    const { count, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (countErr) console.error("⚠️ Error Cek Produk:", countErr);

    if (count === 0) {
      const P = [
        {name:'Oli Mesin Fastron Techno 10W-40',category:'Oli Mesin',price:85000,stock:150,description:'Oli sintetik penuh performa tinggi.',image_url:'https://images.unsplash.com/photo-1621570275819-aa849e8ce79d?w=400&q=80',brand:'Pertamina'},
        {name:'Kampas Rem Depan Bendix Metal King',category:'Rem',price:125000,stock:80,description:'Kampas rem kualitas OEM, daya cengkram tinggi.',image_url:'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',brand:'Bendix'},
        {name:'Minyak Rem DOT 4 Philips (250ml)',category:'Rem',price:45000,stock:200,description:'Minyak rem titik didih tinggi, performa stabil.',image_url:'https://images.unsplash.com/photo-1600863920956-6512140889df?w=400&q=80',brand:'Philips'},
        {name:'Filter Udara K&N Universal Performance',category:'Filter',price:320000,stock:40,description:'Filter udara high-performance, bisa dicuci.',image_url:'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&q=80',brand:'K&N'},
        {name:'Busi NGK Iridium BPR6EIX',category:'Busi',price:95000,stock:120,description:'Busi iridium untuk pembakaran sempurna.',image_url:'https://images.unsplash.com/photo-1599839619722-39751411ea63?w=400&q=80',brand:'NGK'},
        {name:'Aki Kering GS Astra MF 35Ah',category:'Aki',price:650000,stock:30,description:'Aki maintenance-free, siap pakai.',image_url:'https://images.unsplash.com/photo-1520113412548-8df0c656c072?w=400&q=80',brand:'GS Astra'},
        {name:'Sarung Jok Kulit Premium MBtech',category:'Aksesoris',price:1200000,stock:15,description:'Sarung pelapis jok mobil bahan kulit sintetis.',image_url:'https://images.unsplash.com/photo-1605810730456-bc9b0e515fa0?w=400&q=80',brand:'MBtech'},
        {name:'Lampu LED Headlight H4 Philips 6000K',category:'Lampu',price:450000,stock:30,description:'Lampu utama LED mobil putih bersih.',image_url:'https://images.unsplash.com/photo-1625047509168-a71c673980b1?w=400&q=80',brand:'Philips'}
      ];
      const { error: insertErr } = await supabase.from('products').insert(P);
      if (insertErr) console.error("⚠️ Error Input Produk:", insertErr);
      else console.log("✅ Produk bawaan berhasil ditambahkan!");
    }
  } catch (e) {
    console.error("⚠️ Fatal Error di initDb:", e);
  }
}
initDb();

// PRODUCTS ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (category) query = query.eq('category', category);
    
    const { data, error } = await query;
    if (error) {
      console.error("⚠️ Error Get Products:", error);
      return res.json([]); // Kembalikan array kosong agar frontend tidak crash
    }
    res.json(data || []);
  } catch (e) {
    console.error("⚠️ Fatal Get Products:", e);
    res.json([]);
  }
});

app.post('/api/products', adminMiddleware, async (req, res) => {
  const p = req.body;
  try {
    const { error } = await supabase.from('products').insert([{ name: p.name, category: p.category, price: +p.price, stock: +p.stock || 0, description: p.description || '', brand: p.brand || '', image_url: p.image_url || '🔧' }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', adminMiddleware, async (req, res) => {
  const p = req.body;
  try {
    const { error } = await supabase.from('products').update({ name: p.name, category: p.category, price: +p.price, stock: +p.stock, description: p.description || '', brand: p.brand || '', image_url: p.image_url || '🔧' }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', adminMiddleware, async (req, res) => {
  await supabase.from('products').delete().eq('id', req.params.id);
  res.json({ success: true });
});

// AUTH ROUTES
app.post('/api/register', async (req, res) => {
  const { name, email, password, vehicle_type } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Semua field wajib diisi' });
  
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) return res.status(400).json({ error: 'Email sudah terdaftar' });
  
  try {
    const hash = bcrypt.hashSync(password, 10);
    const { data: u, error } = await supabase.from('users').insert([{ name, email, password: hash, vehicle_type }]).select().single();
    if (error) throw error;
    
    const token = jwt.sign({ id: u.id, email, role: 'pelanggan', name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, name, email, role: 'pelanggan' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: u } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  
  if (!u || !bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Email atau password salah' });
  
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('users').select('id,name,email,role,vehicle_type').eq('id', req.user.id).single();
  res.json(data);
});

// TRANSACTIONS ROUTES
app.post('/api/transactions', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ error: 'Admin tidak dapat membeli' });
  const { product_id, quantity = 1 } = req.body;
  
  const { data: prod } = await supabase.from('products').select('*').eq('id', product_id).single();
  if (!prod) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  
  try {
    const { error } = await supabase.from('transactions').insert([{ user_id: req.user.id, product_id, quantity, total_price: prod.price * quantity, status: 'Tertunda' }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/transactions/checkout-cart', authMiddleware, async (req, res) => {
  const { delivery_method, address, payment_method, extra_fee } = req.body;
  
  const { data: pendingTxs } = await supabase.from('transactions').select('*').eq('user_id', req.user.id).eq('status', 'Tertunda');
  if (!pendingTxs || pendingTxs.length === 0) return res.status(400).json({ error: 'Keranjang kosong.' });
  
  try {
    let isFeeApplied = false;
    for (let tx of pendingTxs) {
      let finalPrice = tx.total_price;
      if (!isFeeApplied) { finalPrice += (extra_fee || 0); isFeeApplied = true; }
      
      await supabase.from('transactions').update({ status: 'Lunas', delivery_method, address, payment_method, total_price: finalPrice }).eq('id', tx.id);
      
      const { data: prod } = await supabase.from('products').select('stock').eq('id', tx.product_id).single();
      await supabase.from('products').update({ stock: prod.stock - tx.quantity }).eq('id', tx.product_id);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  await supabase.from('transactions').delete().eq('id', req.params.id).eq('user_id', req.user.id).eq('status', 'Tertunda');
  res.json({ success: true });
});

app.get('/api/transactions/my', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('transactions').select('*, products(name, category, image_url)').eq('user_id', req.user.id).order('created_at', { ascending: false });
  const formatted = data.map(t => ({ ...t, product_name: t.products.name, category: t.products.category, image_url: t.products.image_url }));
  res.json(formatted);
});

app.get('/api/transactions/all', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('transactions').select('*, products(name), users(name, email)').order('created_at', { ascending: false });
  const formatted = data.map(t => ({ ...t, product_name: t.products.name, user_name: t.users.name, email: t.users.email }));
  res.json(formatted);
});

// QUEUES ROUTES
app.get('/api/queues/booked-times', async (req, res) => {
  const { date } = req.query;
  const { data } = await supabase.from('queues').select('booking_time').eq('booking_date', date).neq('status', 'selesai');
  res.json(data ? data.map(b => b.booking_time) : []);
});

app.post('/api/queues', authMiddleware, async (req, res) => {
  const q = req.body;
  if (!q.booking_date || !q.booking_time) return res.status(400).json({ error: "Tanggal dan jam servis wajib diisi." });
  
  const { data: check } = await supabase.from('queues').select('id').eq('booking_date', q.booking_date).eq('booking_time', q.booking_time).neq('status', 'selesai').maybeSingle();
  if (check) return res.status(400).json({ error: "Jadwal penuh." });
  
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase.from('queues').select('*', { count: 'exact', head: true }).like('created_at', `${today}%`);
  const queueNumber = (count || 0) + 1;
  
  await supabase.from('queues').insert([{ user_id: req.user.id, service_type: q.service_type, queue_number: queueNumber, status: 'menunggu', phone: q.phone, nopol: q.nopol, rangka: q.rangka, vehicle_details: q.vehicle_details, booking_date: q.booking_date, booking_time: q.booking_time }]);
  res.json({ success: true, queue: { queue_number: queueNumber } });
});

app.get('/api/queues/my', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('queues').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/queues/all', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('queues').select('*, users(name, email)').order('created_at', { ascending: false });
  const formatted = data.map(q => ({ ...q, user_name: q.users.name, email: q.users.email }));
  res.json(formatted);
});

app.put('/api/queues/:id/status', adminMiddleware, async (req, res) => {
  await supabase.from('queues').update({ status: req.body.status }).eq('id', req.params.id);
  res.json({ success: true });
});

// AI & STATS ROUTES
app.post('/api/ai/diagnose', authMiddleware, async (req, res) => {
  const { complaint } = req.body;
  if (!complaint) return res.status(400).json({ error: 'Keluhan tidak boleh kosong' });
  
  const { data: products } = await supabase.from('products').select('name');
  const productList = products ? products.map(p => p.name).join(', ') : '';
  const systemPrompt = `Kamu Kepala Mekanik AI Mandiri Variasi. Analisis keluhan. Beri JSON murni: {"diagnosis":"Penjelasan", "priority":"Tinggi/Sedang/Rendah", "action":"Langkah pertama", "recommended_parts":["Sparepart relevan dari: ${productList}"]}`;
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: complaint }], response_format: { type: "json_object" } }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq Error");
    res.json(JSON.parse(data.choices[0].message.content));
  } catch (e) { res.status(500).json({ error: e.message || 'Gagal.' }); }
});

app.get('/api/ai/recommendations', authMiddleware, async (req, res) => {
  const { data: history } = await supabase.from('transactions').select('products(category)').eq('user_id', req.user.id).eq('status', 'Lunas');
  const cats = history ? history.map(h => h.products.category) : [];
  const recs = [];
  
  if (!cats.includes('Oli Mesin')) recs.push({ reason: '🔧 Belum ada riwayat ganti oli.', priority: 'high' });
  if (!history || history.length === 0) recs.push({ reason: '👋 Selamat datang di Mandiri Variasi!', priority: 'low' });
  
  const { data: products } = await supabase.from('products').select('*').limit(6);
  res.json({ recommendations: recs.slice(0, 3), products: products || [], history_count: history ? history.length : 0 });
});

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  const { count: customers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'pelanggan');
  const { count: orders } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'Lunas');
  const { data: txs } = await supabase.from('transactions').select('total_price').eq('status', 'Lunas');
  const revenue = txs ? txs.reduce((sum, tx) => sum + tx.total_price, 0) : 0;
  const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true });
  
  res.json({ customers: customers || 0, orders: orders || 0, revenue, products: products || 0 });
});

app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('users').select('id,name,email,role,vehicle_type,created_at').order('created_at', { ascending: false });
  res.json(data || []);
});

// STATIC PAGES
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
[['/login','login'], ['/register','register'], ['/dashboard','dashboard'], ['/admin','admin'], ['/about','about']].forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'public', file + '.html')));
});

app.listen(PORT, '0.0.0.0', () => { console.log(`\n🚀 Mandiri Variasi (Supabase Edition) Running on Port ${PORT}\n`); });