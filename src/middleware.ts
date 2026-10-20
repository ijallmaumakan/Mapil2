import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'rahasia_little_olie_super_aman_123';

// Tambahkan interface agar Express mengenal req.user
interface CustomRequest extends Request {
  user?: any;
}

const authenticateToken = (req: CustomRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid!' });
    req.user = user;
    next();
  });
};

export { authenticateToken, JWT_SECRET };