/**
 * FoodieApp JavaScript Functionality
 * This file contains all the interactive functionality for the FoodieApp website
 */

// Global Variables
let cartItems = [];
let darkModeEnabled = false;

// DOM Elements (will be initialized when document is loaded)
let cartCountElement;
let mobileMenu;
let allTabs;

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    cartCountElement = document.getElementById('cart-count');
    mobileMenu = document.getElementById('mobile-menu');
    allTabs = document.querySelectorAll('.tab-content');
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load cart from local storage if available
    loadCartFromStorage();
    
    // Check user's preferred color scheme
    checkUserColorScheme();
});

/**
 * Initialize all event listeners for the app
 */
function initializeEventListeners() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Add event listeners to all "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            const productPrice = parseFloat(this.getAttribute('data-product-price'));
            addToCart(productId, productName, productPrice);
        });
    });
    
    // Menu toggle for mobile
    const menuIcon = document.getElementById('menu-icon');
    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMobileMenu);
    }
}

/**
 * Show a specific tab and hide others
 * @param {string} tabId - The ID of the tab to show
 */
function showTab(tabId) {
    // Hide all tabs
    allTabs.forEach(tab => {
        tab.classList.remove('active-tab');
    });
    
    // Show the selected tab
    const selectedTab = document.getElementById(`${tabId}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active-tab');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

/**
 * Toggle submenu in mobile view
 * @param {string} submenuId - The ID of the submenu to toggle
 */
function toggleMobileSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.classList.toggle('hidden');
    }
}

/**
 * Add an item to the shopping cart
 * @param {string} id - Product ID
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {number} quantity - Quantity to add (default: 1)
 */
function addToCart(id, name, price, quantity = 1) {
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === id);
    
    if (existingItemIndex > -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cartItems.push({
            id: id,
            name: name,
            price: price,
            quantity: quantity
        });
    }
    
    // Update cart UI
    updateCartUI();
    
    // Save cart to local storage
    saveCartToStorage();
    
    // Show success message
    showNotification(`Added ${name} to cart!`, 'success');
}

/**
 * Remove an item from the cart
 * @param {string} id - Product ID to remove
 */
function removeFromCart(id) {
    // Find the item index
    const itemIndex = cartItems.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        const removedItem = cartItems[itemIndex];
        
        // Remove the item
        cartItems.splice(itemIndex, 1);
        
        // Update cart UI
        updateCartUI();
        
        // Save cart to local storage
        saveCartToStorage();
        
        // Show notification
        showNotification(`Removed ${removedItem.name} from cart`, 'info');
    }
}

/**
 * Update item quantity in cart
 * @param {string} id - Product ID
 * @param {number} newQuantity - New quantity value
 */
function updateCartItemQuantity(id, newQuantity) {
    // Find the item
    const itemIndex = cartItems.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or negative
            removeFromCart(id);
        } else {
            // Update quantity
            cartItems[itemIndex].quantity = newQuantity;
            
            // Update cart UI
            updateCartUI();
            
            // Save cart to local storage
            saveCartToStorage();
        }
    }
}

/**
 * Update the cart UI elements
 */
function updateCartUI() {
    // Update cart count
    if (cartCountElement) {
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
    
    // Update cart items list if on cart page
    const cartItemsList = document.getElementById('cart-items-list');
    if (cartItemsList) {
        renderCartItems(cartItemsList);
    }
    
    // Update cart total
    updateCartTotal();
}

/**
 * Render cart items in the provided element
 * @param {HTMLElement} container - The container to render items in
 */
function renderCartItems(container) {
    // Clear the container
    container.innerHTML = '';
    
    if (cartItems.length === 0) {
        // Show empty cart message
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-shopping-cart text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">Your cart is empty</p>
                <a href="#" class="text-orange-500 font-medium mt-2 inline-block" onclick="showTab('menu'); return false;">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    // Render each cart item
    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between py-4 border-b';
        itemElement.innerHTML = `
            <div class="flex items-center">
                <div class="w-16 h-16 bg-gray-200 rounded"></div>
                <div class="ml-4">
                    <h3 class="font-medium">${item.name}</h3>
                    <p class="text-gray-600">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center">
                <button class="px-2 py-1 bg-gray-200 rounded-l" onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span class="px-4 py-1 bg-gray-100">${item.quantity}</span>
                <button class="px-2 py-1 bg-gray-200 rounded-r" onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
                <button class="ml-4 text-red-500" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(itemElement);
    });
}

/**
 * Update the cart total price display
 */
function updateCartTotal() {
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }
}

/**
 * Save the current cart to local storage
 */
function saveCartToStorage() {
    localStorage.setItem('foodieAppCart', JSON.stringify(cartItems));
}

/**
 * Load cart from local storage
 */
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('foodieAppCart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartUI();
    }
}

/**
 * Clear the entire cart
 */
function clearCart() {
    cartItems = [];
    updateCartUI();
    saveCartToStorage();
    showNotification('Cart has been cleared', 'info');
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    darkModeEnabled = !darkModeEnabled;
    
    // Save preference in local storage
    localStorage.setItem('foodieAppDarkMode', darkModeEnabled);
    
    // Update icon
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            if (darkModeEnabled) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
}

/**
 * Check user's preferred color scheme
 */
function checkUserColorScheme() {
    // Check local storage first
    const savedDarkMode = localStorage.getItem('foodieAppDarkMode');
    
    if (savedDarkMode !== null) {
        // Use saved preference
        if (savedDarkMode === 'true') {
            darkModeEnabled = true;
            document.body.classList.add('dark-mode');
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Use system preference if no saved preference
        darkModeEnabled = true;
        document.body.classList.add('dark-mode');
    }
    
    // Update icon if dark mode is enabled
    if (darkModeEnabled) {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    // Set classes based on type
    let bgColor = 'bg-blue-500';
    let icon = 'fa-info-circle';
    
    if (type === 'success') {
        bgColor = 'bg-green-500';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-red-500';
        icon = 'fa-exclamation-circle';
    }
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white py-2 px-4 rounded-md shadow-lg flex items-center transition-opacity duration-300 z-50`;
    notification.innerHTML = `
        <i class="fas ${icon} mr-2"></i>
        <span>${message}</span>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Submit the order form
 * @param {Event} event - Form submission event
 */
function submitOrder(event) {
    event.preventDefault();
    
    // Simple validation
    const form = event.target;
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const addressInput = form.querySelector('textarea[name="address"]');
    
    if (!nameInput.value || !emailInput.value || !addressInput.value) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Submit order (this would normally go to a backend)
    const orderNumber = Math.floor(Math.random() * 1000000);
    
    showNotification('Order placed successfully!', 'success');
    
    // Clear cart
    clearCart();
    
    // Show order confirmation
    const orderConfirmation = document.getElementById('order-confirmation');
    if (orderConfirmation) {
        orderConfirmation.classList.remove('hidden');
        document.getElementById('order-number').textContent = orderNumber;
        
        // Hide order form
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.classList.add('hidden');
        }
    }
}

/**
 * Filter menu items by category
 * @param {string} category - Category to filter by
 */
function filterMenuByCategory(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Update active category button
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        if (button.getAttribute('data-category') === category) {
            button.classList.add('bg-orange-500', 'text-white');
            button.classList.remove('bg-gray-200', 'text-gray-800');
        } else {
            button.classList.remove('bg-orange-500', 'text-white');
            button.classList.add('bg-gray-200', 'text-gray-800');
        }
    });
}

/**
 * Search functionality
 * @param {string} query - Search query
 */
function searchSite(query) {
    // This would typically connect to a backend search API
    // For now, we'll just show a notification
    showNotification(`Searching for: ${query}`, 'info');
}

/**
 * Submit newsletter subscription
 * @param {Event} event - Form submission event
 */
function subscribeNewsletter(event) {
    event.preventDefault();
    
    const emailInput = event.target.querySelector('input[type="email"]');
    if (!emailInput || !emailInput.value) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // This would typically send to a backend API
    showNotification('Thank you for subscribing!', 'success');
    emailInput.value = '';
}

/**
 * Play video (placeholder function)
 * @param {string} videoId - ID of the video to play
 */
function playVideo(videoId) {
    showNotification(`Playing video: ${videoId}`, 'info');
    // This would typically open a modal or play an embedded video
}

/**
 * Submit contact form
 * @param {Event} event - Form submission event
 */
function submitContactForm(event) {
    event.preventDefault();
    
    // Simple validation
    const form = event.target;
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');
    
    if (!nameInput.value || !emailInput.value || !messageInput.value) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // This would typically send to a backend API
    showNotification('Your message has been sent!', 'success');
    
    // Reset form
    form.reset();
}

/**
 * Format a price number as currency
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
function formatCurrency(price) {
    return '$' + price.toFixed(2);
}