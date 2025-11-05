require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./server/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window for auth
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window for API
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'demo@example.com',
    pass: process.env.EMAIL_PASS || 'demo-password'
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, email } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

// Recipe endpoints
app.get('/api/recipes/recommended', apiLimiter, (req, res) => {
  db.all('SELECT * FROM recipes WHERE is_recommended = 1 ORDER BY created_at DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recipes' });
    }
    res.json(rows);
  });
});

app.get('/api/recipes', apiLimiter, authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch recipes' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/recipes', apiLimiter, authenticateToken, (req, res) => {
  const { name, ingredients, instructions } = req.body;

  if (!name || !ingredients) {
    return res.status(400).json({ error: 'Name and ingredients required' });
  }

  db.run(
    'INSERT INTO recipes (user_id, name, ingredients, instructions) VALUES (?, ?, ?, ?)',
    [req.user.id, name, ingredients, instructions],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create recipe' });
      }
      res.json({ id: this.lastID, name, ingredients, instructions });
    }
  );
});

app.delete('/api/recipes/:id', apiLimiter, authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM recipes WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete recipe' });
      }
      res.json({ success: true });
    }
  );
});

// Item endpoints
app.get('/api/items/recommended', apiLimiter, (req, res) => {
  db.all('SELECT * FROM items WHERE is_recommended = 1 ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
    res.json(rows);
  });
});

app.get('/api/items', apiLimiter, authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM items WHERE user_id = ? ORDER BY name',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch items' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/items', apiLimiter, authenticateToken, (req, res) => {
  const { name, category } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  db.run(
    'INSERT INTO items (user_id, name, category) VALUES (?, ?, ?)',
    [req.user.id, name, category],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create item' });
      }
      res.json({ id: this.lastID, name, category });
    }
  );
});

app.delete('/api/items/:id', apiLimiter, authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM items WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete item' });
      }
      res.json({ success: true });
    }
  );
});

// Cart endpoints
app.get('/api/cart', apiLimiter, authenticateToken, (req, res) => {
  db.all(
    `SELECT c.*, r.name as recipe_name, r.ingredients, i.name as item_name, i.category
     FROM cart c
     LEFT JOIN recipes r ON c.recipe_id = r.id
     LEFT JOIN items i ON c.item_id = i.id
     WHERE c.user_id = ?
     ORDER BY c.added_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/cart/recipe', apiLimiter, authenticateToken, (req, res) => {
  const { recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID required' });
  }

  db.run(
    'INSERT INTO cart (user_id, recipe_id) VALUES (?, ?)',
    [req.user.id, recipeId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add recipe to cart' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post('/api/cart/item', apiLimiter, authenticateToken, (req, res) => {
  const { itemId, quantity } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'Item ID required' });
  }

  db.run(
    'INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)',
    [req.user.id, itemId, quantity || 1],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add item to cart' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete('/api/cart/:id', apiLimiter, authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM cart WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove from cart' });
      }
      res.json({ success: true });
    }
  );
});

app.post('/api/cart/checkout', apiLimiter, authenticateToken, (req, res) => {
  // Get cart items with details
  db.all(
    `SELECT c.*, r.name as recipe_name, r.ingredients, i.name as item_name, i.category
     FROM cart c
     LEFT JOIN recipes r ON c.recipe_id = r.id
     LEFT JOIN items i ON c.item_id = i.id
     WHERE c.user_id = ?`,
    [req.user.id],
    (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart items' });
      }

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Build shopping list
      let shoppingList = 'Your ShelfHelp Grocery List:\n\n';
      
      const recipes = cartItems.filter(item => item.recipe_id);
      const items = cartItems.filter(item => item.item_id);

      if (recipes.length > 0) {
        shoppingList += 'RECIPES:\n';
        recipes.forEach(recipe => {
          shoppingList += `\n${recipe.recipe_name}:\n`;
          shoppingList += `Ingredients: ${recipe.ingredients}\n`;
        });
        shoppingList += '\n';
      }

      if (items.length > 0) {
        shoppingList += 'INDIVIDUAL ITEMS:\n';
        items.forEach(item => {
          shoppingList += `- ${item.item_name}`;
          if (item.quantity > 1) shoppingList += ` (x${item.quantity})`;
          if (item.category) shoppingList += ` [${item.category}]`;
          shoppingList += '\n';
        });
      }

      shoppingList += '\n\nHappy shopping!\n- ShelfHelp Team';

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@shelfhelp.com',
        to: req.user.email,
        subject: 'Your ShelfHelp Grocery List',
        text: shoppingList
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email error:', error);
          // Continue even if email fails - user can still see the list
        }

        // Clear cart after checkout
        db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id], (err) => {
          if (err) {
            console.error('Failed to clear cart:', err);
          }
          
          res.json({ 
            success: true, 
            shoppingList,
            emailSent: !error 
          });
        });
      });
    }
  );
});

// Serve frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ShelfHelp server running on port ${PORT}`);
});
