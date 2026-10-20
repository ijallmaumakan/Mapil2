import { Router, Request, Response } from 'express';
import { upload } from './config/cloudinary';
import db from './db';

const router = Router();

// Endpoint POST dengan upload gambar ke Cloudinary & simpan ke MySQL
router.post('/menus', upload.single('img'), async (req: Request, res: Response) => {
    try {
        const { name, price, category, desc } = req.body;

        // Validasi sederhana untuk memastikan data terisi dari form-data
        if (!name || !price) {
            return res.status(400).json({ message: 'Nama dan harga wajib diisi!' });
        }

        // Ambil URL file yang berhasil di-upload ke Cloudinary
        const imageUrl = req.file ? (req.file as any).path : null;

        // Query simpan ke database MySQL menggunakan async/await
        const query = 'INSERT INTO menus (name, price, category, `desc`, img) VALUES (?, ?, ?, ?, ?)';
        
        const [result]: any = await (db as any).promise().query(query, [name, price, category, desc, imageUrl]);

        res.status(201).json({
            message: 'Menu berhasil ditambah dan gambar tersimpan di Cloudinary!',
            menuId: result.insertId,
            imageUrl
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Terjadi kesalahan sistem', error: error.message });
    }
});

export default router;