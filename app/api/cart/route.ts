import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get all cart items with their details
    const cartItems = db.prepare(`
      SELECT 
        ci.id,
        ci.type,
        ci.quantity,
        ci.item_id,
        ci.recipe_id,
        i.name as item_name,
        i.category,
        r.name as recipe_name,
        r.description,
        r.ingredients
      FROM cart_items ci
      LEFT JOIN items i ON ci.item_id = i.id
      LEFT JOIN recipes r ON ci.recipe_id = r.id
      WHERE ci.user_id = ?
    `).all(userId);

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { type, itemId, recipeId, quantity = 1 } = await request.json();

    if (!type || (type === 'item' && !itemId) || (type === 'recipe' && !recipeId)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check if item already in cart
    let existing;
    if (type === 'item') {
      existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND item_id = ? AND type = ?')
        .get(userId, itemId, type);
    } else {
      existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND recipe_id = ? AND type = ?')
        .get(userId, recipeId, type);
    }

    if (existing) {
      // Update quantity
      const stmt = db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?');
      stmt.run(quantity, (existing as any).id);
    } else {
      // Insert new cart item
      const stmt = db.prepare(
        'INSERT INTO cart_items (user_id, type, item_id, recipe_id, quantity) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(userId, type, itemId || null, recipeId || null, quantity);
    }

    return NextResponse.json({ message: 'Added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('id');

    if (cartItemId) {
      // Delete specific item
      const stmt = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
      stmt.run(parseInt(cartItemId), userId);
    } else {
      // Clear entire cart
      const stmt = db.prepare('DELETE FROM cart_items WHERE user_id = ?');
      stmt.run(userId);
    }

    return NextResponse.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}
