import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get all cart items
    const cartItems = db.prepare(`
      SELECT 
        ci.type,
        ci.quantity,
        i.name as item_name,
        i.category,
        r.name as recipe_name,
        r.ingredients
      FROM cart_items ci
      LEFT JOIN items i ON ci.item_id = i.id
      LEFT JOIN recipes r ON ci.recipe_id = r.id
      WHERE ci.user_id = ?
    `).all(userId) as Array<{
      type: string;
      quantity: number;
      item_name: string | null;
      category: string | null;
      recipe_name: string | null;
      ingredients: string | null;
    }>;

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Build ingredient list
    const ingredientsList: string[] = [];
    const recipesList: string[] = [];

    for (const item of cartItems) {
      if (item.type === 'item' && item.item_name && item.category) {
        ingredientsList.push(`${item.item_name} (${item.category}) x${item.quantity}`);
      } else if (item.type === 'recipe' && item.recipe_name && item.ingredients) {
        recipesList.push(`\n${item.recipe_name}:`);
        const ingredients = JSON.parse(item.ingredients) as string[];
        ingredients.forEach((ing: string) => {
          ingredientsList.push(`  - ${ing}`);
        });
      }
    }

    // Create email content
    const emailContent = `
Hello ${session.user.name || session.user.email},

Here is your grocery list from ShelfHelp:

${recipesList.length > 0 ? 'RECIPES:\n' + recipesList.join('\n') + '\n' : ''}
INGREDIENTS:
${ingredientsList.join('\n')}

Thank you for using ShelfHelp!
    `.trim();

    // Send email (in production, you'd configure a real SMTP server)
    // For now, we'll use a test account or log it
    console.log('Email content:', emailContent);

    // Create a test transporter (you can configure with real SMTP later)
    let transporter;
    try {
      // Try to create a test account for demonstration
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      // If test account fails, just log and continue
      console.log('Email would be sent to:', session.user.email);
      console.log('Content:', emailContent);
      
      // Clear cart after "sending"
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
      
      return NextResponse.json({ 
        message: 'Checkout complete! (Email logged to console in development mode)',
        emailPreview: emailContent
      });
    }

    // Send email
    const info = await transporter.sendMail({
      from: '"ShelfHelp" <noreply@shelfhelp.com>',
      to: session.user.email,
      subject: 'Your ShelfHelp Grocery List',
      text: emailContent,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    // Clear cart after checkout
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    return NextResponse.json({ 
      message: 'Checkout complete! Check your email for the grocery list.',
      previewUrl: nodemailer.getTestMessageUrl(info),
      emailPreview: emailContent
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
