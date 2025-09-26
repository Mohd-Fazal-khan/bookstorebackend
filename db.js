const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookstore.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('buyer', 'seller'))
      )`);

      // Books table
      db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )`);

      // Cart table
      db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (book_id) REFERENCES books(id),
        UNIQUE(buyer_id, book_id)
      )`);

      // Orders table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
      )`);

      // Insert dummy users
      const users = [
        { name: 'John Buyer', role: 'buyer' },
        { name: 'Sarah Seller', role: 'seller' },
        { name: 'Mike Merchant', role: 'seller' },
        { name: 'Emma Explorer', role: 'buyer' }
      ];

      const userStmt = db.prepare('INSERT OR IGNORE INTO users (name, role) VALUES (?, ?)');
      users.forEach(user => {
        userStmt.run(user.name, user.role);
      });
      userStmt.finalize();

      // Insert dummy books
      const books = [
        {
          seller_id: 2,
          title: 'The Great Gatsby',
          description: 'A classic American novel by F. Scott Fitzgerald',
          price: 15.99,
          stock: 50,
          image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop'
        },
        {
          seller_id: 2,
          title: 'To Kill a Mockingbird',
          description: 'Harper Lee\'s timeless novel about justice and morality',
          price: 12.50,
          stock: 30,
          image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop'
        },
        {
          seller_id: 3,
          title: '1984',
          description: 'George Orwell\'s dystopian masterpiece',
          price: 14.99,
          stock: 25,
          image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop'
        },
        {
          seller_id: 3,
          title: 'Pride and Prejudice',
          description: 'Jane Austen\'s beloved romance novel',
          price: 13.75,
          stock: 40,
          image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop'
        },
        {
          seller_id: 3,
          title: 'Lord of the Flies',
          description: 'William Golding\'s psychological novel',
          price: 11.99,
          stock: 35,
          image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop'
        }
      ];

      const bookStmt = db.prepare(`INSERT OR IGNORE INTO books 
        (seller_id, title, description, price, stock, image_url) 
        VALUES (?, ?, ?, ?, ?, ?)`);
      books.forEach(book => {
        bookStmt.run(book.seller_id, book.title, book.description, book.price, book.stock, book.image_url);
      });
      bookStmt.finalize();

      console.log('Database initialized with dummy data');
      resolve();
    });
  });
};

module.exports = {
  db,
  initializeDatabase
};