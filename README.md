# ShelfHelp

A modern grocery list web application that allows users to save personal grocery data, create recipes, and manage shopping carts. The system features an intuitive UI with user authentication and permissions.

## Features

- 🔐 **User Authentication**: Secure sign-up and sign-in with email and password
- 🍳 **Recipe Management**: Browse recommended recipes and create your own custom recipes
- 🥗 **Item Management**: Browse recommended grocery items and add custom items
- 🛒 **Shopping Cart**: Add recipes and items to cart for easy grocery planning
- 📧 **Email Checkout**: Receive ingredient lists via email (instead of purchasing)
- 👤 **User Permissions**: Personal data isolation - users only see their own recipes/items plus recommended ones
- 📱 **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js v5
- **Database**: SQLite with better-sqlite3
- **Email**: Nodemailer
- **Security**: bcryptjs for password hashing

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Rogatha/ShelfHelp.git
cd ShelfHelp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your values:
```env
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### First Time Setup

1. Click **Sign In** button in the top right
2. Click **Don't have an account? Sign up**
3. Enter your email, password, and optionally your name
4. Click **Sign Up**

### Adding Items to Cart

1. Browse **Recommended Recipes** or **Recommended Items**
2. Click **Add to Cart** or **Add** buttons
3. View your cart in the right sidebar

### Creating Custom Recipes

1. Sign in to your account
2. Click **+ Add Recipe** button
3. Fill in recipe name, description, and ingredients (one per line)
4. Click **Save**
5. Your recipe appears in the list

### Checkout

1. Add items/recipes to your cart
2. Click **Checkout (Email List)** in the cart
3. An alert will show your grocery list
4. In production, this would be emailed to your registered email address

## Project Structure

```
ShelfHelp/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── cart/         # Cart operations
│   │   ├── checkout/     # Email checkout
│   │   ├── items/        # Item CRUD
│   │   ├── recipes/      # Recipe CRUD
│   │   └── register/     # User registration
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── AuthModal.tsx     # Sign in/up modal
│   └── HomePage.tsx      # Main application UI
├── lib/
│   ├── db.ts            # Database configuration
│   └── init.ts          # Database initialization
├── types/
│   └── next-auth.d.ts   # NextAuth type extensions
└── auth.ts              # NextAuth configuration
```

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts (id, email, password, name)
- **recipes**: Recipes (id, user_id, name, description, ingredients, is_recommended)
- **items**: Grocery items (id, user_id, name, category, is_recommended)
- **cart_items**: Shopping cart (id, user_id, item_id, recipe_id, type, quantity)

## Development

### Running Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Environment Variables

- `NEXTAUTH_SECRET`: Secret key for NextAuth.js session encryption
- `NEXTAUTH_URL`: Base URL of your application

### Email Configuration (Optional)

For production email sending, configure SMTP settings in the checkout API route.

## Security Features

- ✅ Password hashing with bcrypt
- ✅ Secure session management with NextAuth.js
- ✅ SQL injection protection with prepared statements
- ✅ User data isolation with foreign key constraints
- ✅ CSRF protection via NextAuth.js

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please open an issue in the GitHub repository.
