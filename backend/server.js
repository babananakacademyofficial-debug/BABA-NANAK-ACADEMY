import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

 dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
const db = new Database(process.env.DB_FILE || './academy.db');

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    course TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    fee INTEGER DEFAULT 0,
    duration TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Baba Nanak Academy API', time: new Date().toISOString() });
});

app.get('/api/courses', (_req, res) => {
  const rows = db.prepare('SELECT id, name, description, fee, duration FROM courses WHERE active = 1 ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/students', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const contact = String(req.body?.contact || '').trim();
  const course = String(req.body?.course || '').trim();

  if (!name || !contact) {
    return res.status(400).json({ ok: false, message: 'Name and email/mobile are required.' });
  }

  const result = db.prepare(
    'INSERT INTO students (name, contact, course) VALUES (?, ?, ?)'
  ).run(name, contact, course || null);

  res.status(201).json({ ok: true, studentId: result.lastInsertRowid, message: 'Registration received.' });
});

app.get('/api/students/:id', (req, res) => {
  const student = db.prepare('SELECT id, name, contact, course, created_at FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ ok: false, message: 'Student not found.' });
  res.json(student);
});

app.use((_req, res) => res.status(404).json({ ok: false, message: 'API route not found.' }));

app.listen(port, () => console.log(`Baba Nanak Academy API running on port ${port}`));
