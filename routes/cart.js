const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET cart items for a buyer
router.get('/buyer/:buyerId', (req, res) => {
  const query = `
    SELECT c.*, b.title, b.price, b.image_url, u.name as seller_name
    FROM cart c
    JOIN books b ON c.book_id = b.id
    JOIN users u ON b.seller_id = u.id
    WHERE c.buyer_id = ?
  `;
  
  db.all(query, [req.params.buyerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST add item to cart
router.post('/', (req, res) => {
  const { buyer_id, book_id, quantity = 1 } = req.body;
  
  if (!buyer_id || !book_id) {
    return res.status(400).json({ error: 'buyer_id and book_id are required' });
  }
  
  // Check if item already exists in cart
  const checkQuery = 'SELECT * FROM cart WHERE buyer_id = ? AND book_id = ?';
  db.get(checkQuery, [buyer_id, book_id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      // Update quantity if item exists
      const updateQuery = 'UPDATE cart SET quantity = quantity + ? WHERE buyer_id = ? AND book_id = ?';
      db.run(updateQuery, [quantity, buyer_id, book_id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Cart updated successfully', cartId: row.id });
      });
    } else {
      // Insert new item
      const insertQuery = 'INSERT INTO cart (buyer_id, book_id, quantity) VALUES (?, ?, ?)';
      db.run(insertQuery, [buyer_id, book_id, quantity], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Item added to cart', cartId: this.lastID });
      });
    }
  });
});

// PUT update cart item quantity
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  
  const query = 'UPDATE cart SET quantity = ? WHERE id = ?';
  db.run(query, [quantity, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cart item not found' });
    } else {
      res.json({ message: 'Cart item updated successfully' });
    }
  });
});

// DELETE cart item
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM cart WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cart item not found' });
    } else {
      res.json({ message: 'Item removed from cart' });
    }
  });
});

// DELETE all cart items for a buyer
router.delete('/buyer/:buyerId', (req, res) => {
  db.run('DELETE FROM cart WHERE buyer_id = ?', [req.params.buyerId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cart cleared successfully', deletedItems: this.changes });
  });
});

// GET cart total for a buyer
router.get('/total/:buyerId', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_items,
      SUM(c.quantity * b.price) as total_amount
    FROM cart c
    JOIN books b ON c.book_id = b.id
    WHERE c.buyer_id = ?
  `;
  
  db.get(query, [req.params.buyerId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      total_items: row.total_items || 0,
      total_amount: row.total_amount || 0
    });
  });
});

module.exports = router;