import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    
    // Get recommended recipes (always visible)
    let recipes;
    
    if (session?.user?.id) {
      // If logged in, get both recommended and user's own recipes
      const userId = parseInt(session.user.id);
      recipes = db.prepare(`
        SELECT * FROM recipes 
        WHERE is_recommended = 1 OR user_id = ?
        ORDER BY is_recommended DESC, created_at DESC
      `).all(userId);
    } else {
      // If not logged in, only show recommended
      recipes = db.prepare('SELECT * FROM recipes WHERE is_recommended = 1 ORDER BY created_at DESC').all();
    }

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { name, description, ingredients } = await request.json();

    if (!name || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const stmt = db.prepare(
      'INSERT INTO recipes (user_id, name, description, ingredients) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(userId, name, description || '', JSON.stringify(ingredients));

    return NextResponse.json({ 
      message: 'Recipe created',
      recipeId: result.lastInsertRowid 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
