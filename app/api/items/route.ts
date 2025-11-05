import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    
    // Get recommended items (always visible)
    let items;
    
    if (session?.user?.id) {
      // If logged in, get both recommended and user's own items
      const userId = parseInt(session.user.id);
      items = db.prepare(`
        SELECT * FROM items 
        WHERE is_recommended = 1 OR user_id = ?
        ORDER BY is_recommended DESC, created_at DESC
      `).all(userId);
    } else {
      // If not logged in, only show recommended
      items = db.prepare('SELECT * FROM items WHERE is_recommended = 1 ORDER BY created_at DESC').all();
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { name, category } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const stmt = db.prepare(
      'INSERT INTO items (user_id, name, category) VALUES (?, ?, ?)'
    );
    const result = stmt.run(userId, name, category || '');

    return NextResponse.json({ 
      message: 'Item created',
      itemId: result.lastInsertRowid 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
