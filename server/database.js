const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../shelfhelp.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Recipes table
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      instructions TEXT,
      is_recommended INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Items table
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      category TEXT,
      is_recommended INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Cart table
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER,
      item_id INTEGER,
      quantity INTEGER DEFAULT 1,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  // Insert some recommended items and recipes
  db.get("SELECT COUNT(*) as count FROM items WHERE is_recommended = 1", (err, row) => {
    if (!err && row.count === 0) {
      const recommendedItems = [
        ['Milk', 'Dairy'],
        ['Bread', 'Bakery'],
        ['Eggs', 'Dairy'],
        ['Apples', 'Produce'],
        ['Chicken Breast', 'Meat'],
        ['Rice', 'Grains'],
        ['Pasta', 'Grains'],
        ['Tomatoes', 'Produce'],
        ['Cheese', 'Dairy'],
        ['Bananas', 'Produce']
      ];

      const stmt = db.prepare("INSERT INTO items (user_id, name, category, is_recommended) VALUES (NULL, ?, ?, 1)");
      recommendedItems.forEach(item => {
        stmt.run(item);
      });
      stmt.finalize();
    }
  });

  db.get("SELECT COUNT(*) as count FROM recipes WHERE is_recommended = 1", (err, row) => {
    if (!err && row.count === 0) {
      const recommendedRecipes = [
        ['Spaghetti Carbonara', 'Pasta, Eggs, Cheese, Bacon', 'Cook pasta, fry bacon, mix with eggs and cheese'],
        ['Chicken Stir Fry', 'Chicken Breast, Rice, Mixed Vegetables, Soy Sauce', 'Cook rice, stir fry chicken and vegetables'],
        ['Greek Salad', 'Tomatoes, Cucumber, Feta Cheese, Olives, Olive Oil', 'Chop vegetables, mix with cheese and olives'],
        ['Breakfast Omelet', 'Eggs, Milk, Cheese, Bell Peppers, Onions', 'Whisk eggs with milk, cook with vegetables and cheese'],
        ['Banana Smoothie', 'Bananas, Milk, Honey, Ice', 'Blend all ingredients until smooth']
      ];

      const stmt = db.prepare("INSERT INTO recipes (user_id, name, ingredients, instructions, is_recommended) VALUES (NULL, ?, ?, ?, 1)");
      recommendedRecipes.forEach(recipe => {
        stmt.run(recipe);
      });
      stmt.finalize();
    }
  });
});

module.exports = db;
