const express = require('express');
const router = express.Router();
const { db } = require('../db');

// POST create order from cart
router.post('/checkout', (req, res) => {
  const { buyer_id } = req.body;
  
  if (!buyer_id) {
    return res.status(400).json({ error: 'buyer_id is required' });
  }
  
  // Get cart items
  const cartQuery = `
    SELECT c.*, b.seller_id
    FROM cart c
    JOIN books b ON c.book_id = b.id
    WHERE c.buyer_id = ?
  `;
  
  db.all(cartQuery, [buyer_id], (err, cartItems) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Create orders for each cart item
    const orderPromises = cartItems.map(item => {
      return new Promise((resolve, reject) => {
        const orderQuery = `
          INSERT INTO orders (buyer_id, seller_id, book_id, quantity, status)
          VALUES (?, ?, ?, ?, 'pending')
        `;
        
        db.run(orderQuery, [buyer_id, item.seller_id, item.book_id, item.quantity], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      });
    });
    
    Promise.all(orderPromises)
      .then(orderIds => {
        // Clear cart after successful order creation
        db.run('DELETE FROM cart WHERE buyer_id = ?', [buyer_id], (err) => {
          if (err) {
            console.error('Error clearing cart:', err);
          }
        });
        
        res.json({ 
          message: 'Orders created successfully', 
          orderIds: orderIds,
          totalOrders: orderIds.length
        });
      })
      .catch(err => {
        res.status(500).json({ error: 'Error creating orders: ' + err.message });
      });
  });
});

// GET orders for a buyer
router.get('/buyer/:buyerId', (req, res) => {
  const query = `
    SELECT o.*, b.title, b.price, b.image_url, u.name as seller_name
    FROM orders o
    JOIN books b ON o.book_id = b.id
    JOIN users u ON o.seller_id = u.id
    WHERE o.buyer_id = ?
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, [req.params.buyerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET orders for a seller
router.get('/seller/:sellerId', (req, res) => {
  const query = `
    SELECT o.*, b.title, b.price, b.image_url, u.name as buyer_name
    FROM orders o
    JOIN books b ON o.book_id = b.id
    JOIN users u ON o.buyer_id = u.id
    WHERE o.seller_id = ?
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, [req.params.sellerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// PUT update order status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  
  if (!status || !['pending', 'shipped'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (pending/shipped) is required' });
  }
  
  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  db.run(query, [status, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      res.json({ message: 'Order status updated successfully' });
    }
  });
});

// GET single order by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT o.*, b.title, b.price, b.image_url, 
           buyer.name as buyer_name, seller.name as seller_name
    FROM orders o
    JOIN books b ON o.book_id = b.id
    JOIN users buyer ON o.buyer_id = buyer.id
    JOIN users seller ON o.seller_id = seller.id
    WHERE o.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });
});

// GET order statistics for seller
router.get('/stats/seller/:sellerId', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
      SUM(o.quantity * b.price) as total_revenue
    FROM orders o
    JOIN books b ON o.book_id = b.id
    WHERE o.seller_id = ?
  `;
  
  db.get(query, [req.params.sellerId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      total_orders: row.total_orders || 0,
      pending_orders: row.pending_orders || 0,
      shipped_orders: row.shipped_orders || 0,
      total_revenue: row.total_revenue || 0
    });
  });
});

module.exports = router;