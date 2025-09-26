const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all users
router.get('/', (req, res) => {
  db.all('SELECT * FROM users ORDER BY id', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET user by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// GET users by role
router.get('/role/:role', (req, res) => {
  const role = req.params.role;
  
  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be buyer or seller' });
  }
  
  db.all('SELECT * FROM users WHERE role = ? ORDER BY id', [role], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST create new user
router.post('/', (req, res) => {
  const { name, role } = req.body;
  
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }
  
  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ error: 'Role must be buyer or seller' });
  }
  
  const query = 'INSERT INTO users (name, role) VALUES (?, ?)';
  db.run(query, [name, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      role
    });
  });
});

// PUT update user
router.put('/:id', (req, res) => {
  const { name, role } = req.body;
  
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }
  
  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ error: 'Role must be buyer or seller' });
  }
  
  const query = 'UPDATE users SET name = ?, role = ? WHERE id = ?';
  db.run(query, [name, role, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User updated successfully' });
    }
  });
});

// DELETE user
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  });
});

module.exports = router;