const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all products for storefront
router.get('/', (req, res) => {
  const query = `
    SELECT b.*, u.name as seller_name 
    FROM books b 
    JOIN users u ON b.seller_id = u.id 
    WHERE b.stock > 0
    ORDER BY b.id DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT b.*, u.name as seller_name 
    FROM books b 
    JOIN users u ON b.seller_id = u.id 
    WHERE b.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

// POST create new product (seller only)
router.post('/', (req, res) => {
  const { seller_id, title, description, price, stock, image_url } = req.body;
  
  if (!seller_id || !title || !price || stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = `
    INSERT INTO books (seller_id, title, description, price, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [seller_id, title, description, price, stock, image_url], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      seller_id,
      title,
      description,
      price,
      stock,
      image_url
    });
  });
});

// GET products by seller ID
router.get('/seller/:sellerId', (req, res) => {
  const query = 'SELECT * FROM books WHERE seller_id = ? ORDER BY id DESC';
  
  db.all(query, [req.params.sellerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// PUT update product
router.put('/:id', (req, res) => {
  const { title, description, price, stock, image_url } = req.body;
  const query = `
    UPDATE books 
    SET title = ?, description = ?, price = ?, stock = ?, image_url = ?
    WHERE id = ?
  `;
  
  db.run(query, [title, description, price, stock, image_url, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  });
});

// DELETE product
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json({ message: 'Product deleted successfully' });
    }
  });
});

module.exports = router;