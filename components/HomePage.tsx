'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import AuthModal from '@/components/AuthModal';

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  is_recommended: boolean;
}

interface Item {
  id: number;
  name: string;
  category: string;
  is_recommended: boolean;
}

interface CartItem {
  id: number;
  type: 'item' | 'recipe';
  quantity: number;
  item_name?: string;
  category?: string;
  recipe_name?: string;
  description?: string;
  ingredients?: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const loadRecipes = useCallback(async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  }, []);

  const loadItems = useCallback(async () => {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }, []);

  const loadCart = useCallback(async () => {
    const res = await fetch('/api/cart');
    if (res.ok) {
      const data = await res.json();
      setCart(data);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await loadRecipes();
      await loadItems();
      if (session) {
        await loadCart();
      }
    };
    void fetchData();
  }, [session, loadRecipes, loadItems, loadCart]);

  const addToCart = async (type: 'item' | 'recipe', id: number) => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        itemId: type === 'item' ? id : undefined,
        recipeId: type === 'recipe' ? id : undefined,
      }),
    });

    if (res.ok) {
      loadCart();
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    const res = await fetch(`/api/cart?id=${cartItemId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      loadCart();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutMessage('Your cart is empty!');
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
    });

    if (res.ok) {
      const data = await res.json();
      setCheckoutMessage(data.message);
      loadCart();
      
      // Show preview if available
      if (data.emailPreview) {
        alert('Grocery list:\n\n' + data.emailPreview);
      }
    } else {
      setCheckoutMessage('Checkout failed. Please try again.');
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const ingredients = formData.get('ingredients')?.toString().split('\n').filter(i => i.trim());

    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        description: formData.get('description'),
        ingredients,
      }),
    });

    if (res.ok) {
      setShowNewRecipe(false);
      form.reset();
      loadRecipes();
    }
  };

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        category: formData.get('category'),
      }),
    });

    if (res.ok) {
      setShowNewItem(false);
      form.reset();
      loadItems();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛒 ShelfHelp</h1>
              <p className="text-sm text-gray-600">Smart grocery lists made easy</p>
            </div>
            <div>
              {session?.user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700">Hello, {session.user.name || session.user.email}!</span>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommended Recipes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">🍳 Recommended Recipes</h2>
                {session && (
                  <button
                    onClick={() => setShowNewRecipe(!showNewRecipe)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    + Add Recipe
                  </button>
                )}
              </div>

              {showNewRecipe && (
                <form onSubmit={handleCreateRecipe} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    name="name"
                    placeholder="Recipe name"
                    required
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <input
                    name="description"
                    placeholder="Description"
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <textarea
                    name="ingredients"
                    placeholder="Ingredients (one per line)"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewRecipe(false)}
                      className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                    <h3 className="font-bold text-lg text-gray-800">
                      {recipe.name}
                      {recipe.is_recommended && <span className="text-xs ml-2 bg-yellow-200 px-2 py-1 rounded">★ Recommended</span>}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                    <details className="text-sm text-gray-700 mb-3">
                      <summary className="cursor-pointer font-semibold">Ingredients</summary>
                      <ul className="list-disc list-inside mt-2">
                        {JSON.parse(recipe.ingredients).map((ing: string, idx: number) => (
                          <li key={idx}>{ing}</li>
                        ))}
                      </ul>
                    </details>
                    <button
                      onClick={() => addToCart('recipe', recipe.id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">🥗 Recommended Items</h2>
                {session && (
                  <button
                    onClick={() => setShowNewItem(!showNewItem)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    + Add Item
                  </button>
                )}
              </div>

              {showNewItem && (
                <form onSubmit={handleCreateItem} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    name="name"
                    placeholder="Item name"
                    required
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <input
                    name="category"
                    placeholder="Category (e.g., Dairy, Produce)"
                    className="w-full px-3 py-2 border rounded-md mb-2"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewItem(false)}
                      className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 hover:shadow-lg transition">
                    <h3 className="font-bold text-gray-800">
                      {item.name}
                      {item.is_recommended && <span className="text-xs ml-1">★</span>}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{item.category}</p>
                    <button
                      onClick={() => addToCart('item', item.id)}
                      className="w-full bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Your Cart</h2>
              
              {!session && (
                <div className="text-center py-8 text-gray-600">
                  <p>Please sign in to use the cart</p>
                </div>
              )}

              {session && cart.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p>Your cart is empty</p>
                </div>
              )}

              {session && cart.length > 0 && (
                <>
                  <div className="max-h-96 overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="border-b py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {item.type === 'item' ? item.item_name : item.recipe_name}
                            </h4>
                            {item.type === 'item' && (
                              <p className="text-xs text-gray-600">{item.category}</p>
                            )}
                            {item.type === 'recipe' && (
                              <p className="text-xs text-gray-600">{item.description}</p>
                            )}
                            <p className="text-sm text-gray-700">Qty: {item.quantity}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition font-bold"
                  >
                    Checkout (Email List)
                  </button>

                  {checkoutMessage && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                      {checkoutMessage}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
