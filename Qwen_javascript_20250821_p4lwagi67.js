const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a SQLite
const db = new sqlite3.Database('./data.db');

// Crear tabla
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      place TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      paid BOOLEAN DEFAULT FALSE,
      created_month TEXT DEFAULT (strftime('%Y-%m', 'now'))
    )
  `);
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === RUTAS ===

app.get('/api/clients', (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const sql = `SELECT * FROM clients WHERE created_month = ? ORDER BY name`;
  db.all(sql, [currentMonth], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/clients', (req, res) => {
  const { name, place, amount, payment_date } = req.body;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const sql = `INSERT INTO clients (name, place, amount, payment_date, paid, created_month) VALUES (?, ?, ?, ?, 0, ?)`;
  db.run(sql, [name, place, amount, payment_date, currentMonth], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Cliente agregado' });
  });
});

app.patch('/api/clients/:id', (req, res) => {
  const { paid } = req.body;
  const sql = `UPDATE clients SET paid = ? WHERE id = ?`;
  db.run(sql, [paid ? 1 : 0, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Estado actualizado', changes: this.changes });
  });
});

app.get('/api/summary', (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const sql = `SELECT SUM(amount) as total_paid FROM clients WHERE paid = 1 AND created_month = ?`;
  db.get(sql, [currentMonth], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ total_paid: row.total_paid || 0 });
  });
});

app.listen(PORT, () => {
  console.log(`🟢 JIREH MANAGER corriendo en http://localhost:${PORT}`);
});