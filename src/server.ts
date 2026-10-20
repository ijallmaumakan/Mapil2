import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from './db';
import { upload } from './config/cloudinary';

// Inisialisasi dotenv untuk Cloudinary & Aiven
dotenv.config();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;
const JWT_SECRET: string = process.env.JWT_SECRET || 'rahasia_little_olie_super_aman_123';

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. ENDPOINT AUTHENTICATION (REGISTER & LOGIN)
// ==========================================

// Register
app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, role } = req.body;
    
    const [existing]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'user';

    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, userRole]);

    return res.status(201).json({ message: 'Registrasi berhasil!' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

// Login (Mendukung email/password apa saja untuk mode testing)
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    // Berikan token bypass dummy agar langsung sukses
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ message: 'Login berhasil!', token });
  } catch (error: any) {
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

// ==========================================
// 3. ENDPOINT CRUD MENU (DENGAN CLOUDINARY & BYPASS TOKEN)
// ==========================================

// READ: Ambil Semua Menu
app.get('/api/menus', async (req: Request, res: Response): Promise<any> => {
  try {
    const [menus] = await db.query('SELECT * FROM menus');
    return res.json(menus);
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal mengambil data menu', error: error.message });
  }
});

// READ: Ambil Menu Berdasarkan ID
app.get('/api/menus/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const [menus]: any = await db.query('SELECT * FROM menus WHERE id = ?', [req.params.id]);
    if (menus.length === 0) return res.status(404).json({ message: 'Menu tidak ditemukan' });
    return res.json(menus[0]);
  } catch (error: any) {
    return res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

// CREATE: Tambah Menu Baru + Upload Gambar ke Cloudinary (Tanpa Validasi Token Ketat)
app.post('/api/menus', upload.single('img'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, price, category, desc } = req.body;
    if (!name || !price) return res.status(400).json({ message: 'Nama dan harga wajib diisi!' });

    // Ambil URL gambar dari Cloudinary jika file diunggah
    const imageUrl = req.file ? (req.file as any).path : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
    const menuCategory = category || 'General';
    const menuDesc = desc || '';

    const [result]: any = await db.query(
      'INSERT INTO menus (name, price, category, `desc`, img) VALUES (?, ?, ?, ?, ?)',
      [name, price, menuCategory, menuDesc, imageUrl]
    );

    return res.status(201).json({ 
      message: 'Menu berhasil ditambahkan dan gambar tersimpan di Cloudinary!', 
      data: { id: result.insertId, name, price, category: menuCategory, desc: menuDesc, img: imageUrl } 
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal menambah menu', error: error.message });
  }
});

// UPDATE: Perbarui Menu + Opsi Update Gambar Cloudinary
app.put('/api/menus/:id', upload.single('img'), async (req: Request, res: Response): Promise<any> => {
  try {
    const menuId = req.params.id;
    const [existing]: any = await db.query('SELECT * FROM menus WHERE id = ?', [menuId]);
    if (existing.length === 0) return res.status(404).json({ message: 'Menu tidak ditemukan' });

    const current = existing[0];
    const name = req.body.name || current.name;
    const price = req.body.price || current.price;
    const category = req.body.category || current.category;
    const desc = req.body.desc || current.desc;
    
    const imageUrl = req.file ? (req.file as any).path : current.img;

    await db.query(
      'UPDATE menus SET name = ?, price = ?, category = ?, `desc` = ?, img = ? WHERE id = ?',
      [name, price, category, desc, imageUrl, menuId]
    );

    return res.json({ message: 'Menu berhasil diperbarui!', data: { id: menuId, name, price, category, desc, img: imageUrl } });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal memperbarui menu', error: error.message });
  }
});

// DELETE: Hapus Menu
app.delete('/api/menus/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const [result]: any = await db.query('DELETE FROM menus WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Menu tidak ditemukan' });

    return res.json({ message: 'Menu berhasil dihapus!' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Gagal menghapus menu', error: error.message });
  }
});

// ==========================================
// 4. JALANKAN SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server TypeScript berjalan di http://localhost:${PORT}`);
});