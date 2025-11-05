// API Configuration
const API_URL = window.location.origin;

// State Management
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
    loadRecommendedItems();
    loadRecommendedRecipes();
});

// Authentication
function initializeAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'flex';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userItemsSection').style.display = 'block';
    
    loadUserRecipes();
    loadUserItems();
    loadCart();
}

function updateUIForLoggedOutUser() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('userSection').style.display = 'none';
    document.getElementById('userItemsSection').style.display = 'none';
    document.getElementById('cartItems').innerHTML = '';
    document.getElementById('cartEmpty').style.display = 'block';
    document.getElementById('checkoutBtn').style.display = 'none';
}

// Event Listeners
function setupEventListeners() {
    // Modal controls
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            closeModal(modalId);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Auth buttons
    document.getElementById('showLoginBtn').addEventListener('click', () => openModal('loginModal'));
    document.getElementById('showRegisterBtn').addEventListener('click', () => openModal('registerModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('addRecipeForm').addEventListener('submit', handleAddRecipe);
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

    // Add buttons
    document.getElementById('showAddRecipeBtn').addEventListener('click', () => openModal('addRecipeModal'));
    document.getElementById('showAddItemBtn').addEventListener('click', () => openModal('addItemModal'));

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Auth handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        closeModal('loginModal');
        updateUIForLoggedInUser();
        errorDiv.textContent = '';
        document.getElementById('loginForm').reset();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        closeModal('registerModal');
        updateUIForLoggedInUser();
        errorDiv.textContent = '';
        document.getElementById('registerForm').reset();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateUIForLoggedOutUser();
}

// Load recommended items
async function loadRecommendedRecipes() {
    const container = document.getElementById('recommendedRecipes');
    container.innerHTML = '<div class="loading">Loading recipes</div>';

    try {
        const response = await fetch(`${API_URL}/api/recipes/recommended`);
        const recipes = await response.json();

        if (recipes.length === 0) {
            container.innerHTML = '<p style="color: #666;">No recommended recipes available.</p>';
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="item-card">
                <h3>${escapeHtml(recipe.name)}</h3>
                <p><strong>Ingredients:</strong> ${escapeHtml(recipe.ingredients)}</p>
                ${recipe.instructions ? `<p><strong>Instructions:</strong> ${escapeHtml(recipe.instructions)}</p>` : ''}
                <div class="item-card-actions">
                    <button class="btn btn-primary btn-small" onclick="addRecipeToCart(${recipe.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: #f44336;">Failed to load recipes.</p>';
    }
}

async function loadRecommendedItems() {
    const container = document.getElementById('recommendedItems');
    container.innerHTML = '<div class="loading">Loading items</div>';

    try {
        const response = await fetch(`${API_URL}/api/items/recommended`);
        const items = await response.json();

        if (items.length === 0) {
            container.innerHTML = '<p style="color: #666;">No recommended items available.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card">
                <h3>${escapeHtml(item.name)}</h3>
                ${item.category ? `<p>Category: ${escapeHtml(item.category)}</p>` : ''}
                <div class="item-card-actions">
                    <button class="btn btn-primary btn-small" onclick="addItemToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: #f44336;">Failed to load items.</p>';
    }
}

// Load user's items
async function loadUserRecipes() {
    if (!authToken) return;

    const container = document.getElementById('userRecipes');
    container.innerHTML = '<div class="loading">Loading your recipes</div>';

    try {
        const response = await fetch(`${API_URL}/api/recipes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const recipes = await response.json();

        if (recipes.length === 0) {
            container.innerHTML = '<p style="color: #666;">You haven\'t added any recipes yet.</p>';
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="item-card">
                <h3>${escapeHtml(recipe.name)}</h3>
                <p><strong>Ingredients:</strong> ${escapeHtml(recipe.ingredients)}</p>
                ${recipe.instructions ? `<p><strong>Instructions:</strong> ${escapeHtml(recipe.instructions)}</p>` : ''}
                <div class="item-card-actions">
                    <button class="btn btn-primary btn-small" onclick="addRecipeToCart(${recipe.id})">
                        Add to Cart
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteRecipe(${recipe.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: #f44336;">Failed to load your recipes.</p>';
    }
}

async function loadUserItems() {
    if (!authToken) return;

    const container = document.getElementById('userItems');
    container.innerHTML = '<div class="loading">Loading your items</div>';

    try {
        const response = await fetch(`${API_URL}/api/items`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const items = await response.json();

        if (items.length === 0) {
            container.innerHTML = '<p style="color: #666;">You haven\'t added any items yet.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card">
                <h3>${escapeHtml(item.name)}</h3>
                ${item.category ? `<p>Category: ${escapeHtml(item.category)}</p>` : ''}
                <div class="item-card-actions">
                    <button class="btn btn-primary btn-small" onclick="addItemToCart(${item.id})">
                        Add to Cart
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteItem(${item.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: #f44336;">Failed to load your items.</p>';
    }
}

// Add recipe
async function handleAddRecipe(e) {
    e.preventDefault();
    const name = document.getElementById('recipeName').value;
    const ingredients = document.getElementById('recipeIngredients').value;
    const instructions = document.getElementById('recipeInstructions').value;
    const errorDiv = document.getElementById('addRecipeError');

    try {
        const response = await fetch(`${API_URL}/api/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, ingredients, instructions })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add recipe');
        }

        closeModal('addRecipeModal');
        document.getElementById('addRecipeForm').reset();
        errorDiv.textContent = '';
        loadUserRecipes();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

// Add item
async function handleAddItem(e) {
    e.preventDefault();
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const errorDiv = document.getElementById('addItemError');

    try {
        const response = await fetch(`${API_URL}/api/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, category })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add item');
        }

        closeModal('addItemModal');
        document.getElementById('addItemForm').reset();
        errorDiv.textContent = '';
        loadUserItems();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

// Delete recipe
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
        const response = await fetch(`${API_URL}/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            loadUserRecipes();
        }
    } catch (error) {
        alert('Failed to delete recipe');
    }
}

// Delete item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${API_URL}/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            loadUserItems();
        }
    } catch (error) {
        alert('Failed to delete item');
    }
}

// Cart functions
async function addRecipeToCart(recipeId) {
    if (!authToken) {
        alert('Please sign in to add items to your cart');
        openModal('loginModal');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/cart/recipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ recipeId })
        });

        if (response.ok) {
            loadCart();
        }
    } catch (error) {
        alert('Failed to add recipe to cart');
    }
}

async function addItemToCart(itemId) {
    if (!authToken) {
        alert('Please sign in to add items to your cart');
        openModal('loginModal');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/cart/item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ itemId, quantity: 1 })
        });

        if (response.ok) {
            loadCart();
        }
    } catch (error) {
        alert('Failed to add item to cart');
    }
}

async function loadCart() {
    if (!authToken) return;

    const container = document.getElementById('cartItems');
    const emptyMessage = document.getElementById('cartEmpty');
    const checkoutBtn = document.getElementById('checkoutBtn');

    try {
        const response = await fetch(`${API_URL}/api/cart`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const cartItems = await response.json();

        if (cartItems.length === 0) {
            container.innerHTML = '';
            emptyMessage.style.display = 'block';
            checkoutBtn.style.display = 'none';
            return;
        }

        emptyMessage.style.display = 'none';
        checkoutBtn.style.display = 'block';

        container.innerHTML = cartItems.map(item => {
            const isRecipe = item.recipe_id !== null;
            const name = isRecipe ? item.recipe_name : item.item_name;
            const details = isRecipe ? item.ingredients : (item.category || 'No category');
            const type = isRecipe ? 'recipe' : 'item';

            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h3>${escapeHtml(name)}</h3>
                        <p>${escapeHtml(details)}</p>
                        <span class="cart-item-type ${type}">${isRecipe ? 'Recipe' : 'Item'}</span>
                        ${!isRecipe && item.quantity > 1 ? `<span style="margin-left: 0.5rem;">x${item.quantity}</span>` : ''}
                    </div>
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

async function removeFromCart(cartItemId) {
    try {
        const response = await fetch(`${API_URL}/api/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            loadCart();
        }
    } catch (error) {
        alert('Failed to remove item from cart');
    }
}

async function handleCheckout() {
    if (!confirm('Checkout and send grocery list to your email?')) return;

    try {
        const response = await fetch(`${API_URL}/api/cart/checkout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Checkout failed');
        }

        // Show success message
        const messageDiv = document.getElementById('checkoutMessage');
        const previewDiv = document.getElementById('shoppingListPreview');

        if (data.emailSent) {
            messageDiv.innerHTML = '<div class="success-message">Your grocery list has been sent to ' + 
                escapeHtml(currentUser.email) + '!</div>';
        } else {
            messageDiv.innerHTML = '<div class="error">Email could not be sent, but here\'s your grocery list:</div>';
        }

        previewDiv.textContent = data.shoppingList;

        openModal('checkoutModal');
        loadCart();
    } catch (error) {
        alert('Checkout failed: ' + error.message);
    }
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
