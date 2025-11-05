# ShelfHelp

A modern web application for quickly generating grocery lists with an intuitive UI and user permissions system.

## Features

- 🔐 **User Authentication**: Secure sign-in/register system with email
- 📝 **Recipe Management**: Create, save, and manage your favorite recipes
- 🛍️ **Item Management**: Add and organize individual grocery items
- 🛒 **Shopping Cart**: Add recipes and items to your cart
- 📧 **Email Integration**: Receive your grocery list via email at checkout
- 👀 **Browse Recommended**: Discover recommended recipes and items
- 💾 **Persistent Storage**: All your data is saved to your account

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
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

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the email configuration with your SMTP credentials:
- For Gmail: Use an App Password from https://myaccount.google.com/apppasswords
- Update `EMAIL_USER` and `EMAIL_PASS` with your credentials
- Change `JWT_SECRET` to a secure random string

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Getting Started

1. **Sign Up**: Click "Register" to create an account with your email
2. **Browse**: Explore recommended recipes and items on the home page
3. **Add to Cart**: Click "Add to Cart" on any recipe or item
4. **Manage Your Items**: Create your own recipes and items when signed in
5. **Checkout**: Click "Checkout & Email List" to receive your grocery list via email

### User Permissions

- **Guest Users**: Can browse recommended items and recipes
- **Registered Users**: Can save recipes, items, and use the shopping cart

### Features

#### Recipes
- Browse recommended recipes
- Create custom recipes with ingredients and instructions
- Add recipes to your cart
- Delete your saved recipes

#### Items
- Browse recommended grocery items
- Create custom grocery items with categories
- Add items to your cart
- Delete your saved items

#### Shopping Cart
- Add multiple recipes and items
- View all ingredients from recipes
- Remove items from cart
- Checkout to receive list via email

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Email**: Nodemailer
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Recipes
- `GET /api/recipes/recommended` - Get recommended recipes
- `GET /api/recipes` - Get user's recipes (auth required)
- `POST /api/recipes` - Create recipe (auth required)
- `DELETE /api/recipes/:id` - Delete recipe (auth required)

### Items
- `GET /api/items/recommended` - Get recommended items
- `GET /api/items` - Get user's items (auth required)
- `POST /api/items` - Create item (auth required)
- `DELETE /api/items/:id` - Delete item (auth required)

### Cart
- `GET /api/cart` - Get cart items (auth required)
- `POST /api/cart/recipe` - Add recipe to cart (auth required)
- `POST /api/cart/item` - Add item to cart (auth required)
- `DELETE /api/cart/:id` - Remove from cart (auth required)
- `POST /api/cart/checkout` - Checkout and email list (auth required)

## Development

For development with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Environment variables for sensitive configuration
- Input validation and sanitization

## License

ISC License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

