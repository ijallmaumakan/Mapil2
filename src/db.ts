import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const getPoolConfig = () => {
  // Opsi 1: Menggunakan Service URI Aiven (DATABASE_URL)
  const dbUri = process.env.DATABASE_URL || process.env.AIVEN_DATABASE_URL;
  if (dbUri) {
    return {
      uri: dbUri,
      ssl: {
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  // Opsi 2: Menggunakan Host, Port, User, Password, DB
  const host = process.env.DB_HOST || 'localhost';
  const isAiven = host.includes('aivencloud.com') || process.env.DB_SSL === 'true';

  return {
    host: host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: isAiven ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
};

const poolConfig = getPoolConfig();
const db = mysql.createPool(poolConfig as any).promise();

export const initDatabase = async (): Promise<void> => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user'
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        \`desc\` TEXT,
        img TEXT
      )
    `);
    console.log('✅ Tabel database (users & menus) siap digunakan di Aiven / MySQL!');
  } catch (error: any) {
    console.error('❌ Gagal inisialisasi tabel database:', error.message);
  }
};

initDatabase();

export default db;