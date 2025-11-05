import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'shelfhelp.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDB() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Recipes table (removed foreign key for recommended items)
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      ingredients TEXT NOT NULL,
      is_recommended BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Items table (removed foreign key for recommended items)
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      is_recommended BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cart items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER,
      recipe_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('item', 'recipe')),
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )
  `);

  // Insert some recommended items and recipes (public items with user_id 0)
  const checkRecommended = db.prepare('SELECT COUNT(*) as count FROM items WHERE is_recommended = 1').get() as { count: number };
  
  if (checkRecommended.count === 0) {
    const insertItem = db.prepare('INSERT INTO items (user_id, name, category, is_recommended) VALUES (?, ?, ?, 1)');
    insertItem.run(0, 'Milk', 'Dairy');
    insertItem.run(0, 'Bread', 'Bakery');
    insertItem.run(0, 'Eggs', 'Dairy');
    insertItem.run(0, 'Chicken Breast', 'Meat');
    insertItem.run(0, 'Tomatoes', 'Produce');
    insertItem.run(0, 'Lettuce', 'Produce');
    insertItem.run(0, 'Cheese', 'Dairy');
    insertItem.run(0, 'Rice', 'Grains');
  }

  const checkRecipes = db.prepare('SELECT COUNT(*) as count FROM recipes WHERE is_recommended = 1').get() as { count: number };
  
  if (checkRecipes.count === 0) {
    const insertRecipe = db.prepare('INSERT INTO recipes (user_id, name, description, ingredients, is_recommended) VALUES (?, ?, ?, ?, 1)');
    insertRecipe.run(0, 'Classic Scrambled Eggs', 'Quick and easy breakfast', JSON.stringify(['3 eggs', '2 tbsp milk', '1 tbsp butter', 'salt', 'pepper']));
    insertRecipe.run(0, 'Chicken Caesar Salad', 'Healthy lunch option', JSON.stringify(['2 chicken breasts', '1 head romaine lettuce', '1/2 cup caesar dressing', 'croutons', 'parmesan cheese']));
    insertRecipe.run(0, 'Simple Fried Rice', 'Easy dinner with leftovers', JSON.stringify(['2 cups cooked rice', '2 eggs', '1 cup mixed vegetables', '3 tbsp soy sauce', '2 tbsp vegetable oil']));
    insertRecipe.run(0, 'Caprese Salad', 'Fresh Italian appetizer', JSON.stringify(['2 large tomatoes', '8 oz fresh mozzarella', 'fresh basil leaves', '2 tbsp olive oil', 'balsamic vinegar', 'salt', 'pepper']));
  }
}

export default db;
