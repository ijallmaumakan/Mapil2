import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Konfigurasi akun Cloudinary Anda (ambil dari dashboard Cloudinary)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'cpfamzy1',
  api_key: process.env.CLOUDINARY_API_KEY || '683539759314992',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'm0Pn2cBUh33ndVZr2Z8EX5Topp8'
}); 2

// Atur penyimpanan (storage) multer ke Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'little-olie-menus',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  } as any // Mengatasi tipe data parameter cloudinary
});

export const upload = multer({ storage: storage });
export { cloudinary };