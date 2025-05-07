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

/**
 * Wait for the DOM to be fully loaded
 */
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

    // Initialize cart page if on cart.html
    if (window.location.pathname.includes('#cart')) {
        displayCartItems();
    }
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

    // Cart page specific event listeners
    if (window.location.pathname.includes('#cart')) {
        // Payment method toggle
        const codRadio = document.getElementById('cod');
        const onlineRadio = document.getElementById('online');
        const onlinePaymentFields = document.getElementById('online-payment-fields');
        if (codRadio && onlineRadio && onlinePaymentFields) {
            codRadio.addEventListener('change', () => {
                onlinePaymentFields.classList.add('hidden');
            });
            onlineRadio.addEventListener('change', () => {
                onlinePaymentFields.classList.remove('hidden');
            });
        }

        // Promo code application
        const promoButton = document.querySelector('button[onclick="applyPromo()"]');
        if (promoButton) {
            promoButton.addEventListener('click', applyPromo);
        }

        // Checkout button
        const checkoutButton = document.querySelector('button[onclick="proceedToCheckout()"]');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', proceedToCheckout);
        }
    }
}

/**
 * Show a specific tab and hide others
 * @param {string} tabId - The ID of the tab to show
 */
function showTab(tabId) {
    allTabs.forEach(tab => {
        tab.classList.remove('active-tab');
    });
    
    const selectedTab = document.getElementById(`${tabId}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active-tab');
    }
    
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
    const existingItemIndex = cartItems.findIndex(item => item.id === id);
    
    if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        cartItems.push({
            id: id,
            name: name,
            price: price,
            quantity: quantity
        });
    }
    
    updateCartUI();
    saveCartToStorage();
    showNotification(`Added ${name} to cart!`, 'success');
    window.location.href = '#cart';
}

/**
 * Remove an item from the cart
 * @param {string} id - Product ID to remove
 */
function removeFromCart(id) {
    const itemIndex = cartItems.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        const removedItem = cartItems[itemIndex];
        cartItems.splice(itemIndex, 1);
        updateCartUI();
        saveCartToStorage();
        showNotification(`Removed ${removedItem.name} from cart`, 'info');
    }
}

/**
 * Update item quantity in cart
 * @param {string} id - Product ID
 * @param {number} newQuantity - New quantity value
 */
function updateCartItemQuantity(id, newQuantity) {
    const itemIndex = cartItems.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            removeFromCart(id);
        } else {
            cartItems[itemIndex].quantity = newQuantity;
            updateCartUI();
            saveCartToStorage();
        }
    }
}

/**
 * Display cart items on the cart page
 */
function displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (!cartContainer || !emptyCartMessage) return;

    cartItems = JSON.parse(localStorage.getItem('foodieAppCart')) || [];
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = '';
        emptyCartMessage.classList.remove('hidden');
        updateCartTotals();
        return;
    }

    emptyCartMessage.classList.add('hidden');
    cartContainer.innerHTML = cartItems.map(item => `
        <div class="flex items-center justify-between border-b pb-4">
            <div class="flex items-center space-x-4">
                <div class="w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
                    <span class="text-gray-600">Item Image</span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${item.name}</h3>
                    <p class="text-gray-600">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-6">
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})" class="text-gray-600 hover:text-orange-500">-</button>
                    <span class="text-gray-800">${item.quantity}</span>
                    <button onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})" class="text-gray-600 hover:text-orange-500">+</button>
                </div>
                <p class="text-gray-800 font-bold">$${(item.price * item.quantity).toFixed(2)}</p>
                <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    updateCartTotals();
}

/**
 * Update cart totals (subtotal, delivery, tax, total)
 */
function updateCartTotals() {
    const subtotalElement = document.querySelector('.flex.justify-between p:nth-child(2):not(.text-orange-500)');
    const taxElement = document.querySelectorAll('.flex.justify-between p:nth-child(2)')[1];
    const totalElement = document.querySelector('.flex.justify-between p.text-orange-500');
    const deliveryFeeElement = document.querySelectorAll('.flex.justify-between p:nth-child(2)')[0];

    if (subtotalElement && taxElement && totalElement && deliveryFeeElement) {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = cartItems.length > 0 ? 2.50 : 0;
        const tax = subtotal * 0.10;
        const total = subtotal + deliveryFee + tax;

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        deliveryFeeElement.textContent = `$${deliveryFee.toFixed(2)}`;
        taxElement.textContent = `$${tax.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

/**
 * Apply promo code
 */
function applyPromo() {
    const promoInput = document.querySelector('input[placeholder="Apply Promo Code"]');
    if (!promoInput) return;

    const promoCode = promoInput.value.trim();
    // TODO: Implement actual promo code validation with backend
    if (promoCode === 'FOODIE10') {
        const totalElement = document.querySelector('.flex.justify-between p.text-orange-500');
        const currentTotal = parseFloat(totalElement.textContent.replace('$', ''));
        const discountedTotal = currentTotal * 0.9; // 10% discount
        totalElement.textContent = `$${discountedTotal.toFixed(2)}`;
        showNotification('Promo code applied successfully!', 'success');
        promoInput.value = '';
    } else {
        showNotification('Invalid promo code', 'error');
    }
}

/**
 * Validate and process checkout
 */
function proceedToCheckout() {
    // Validate cart
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Validate delivery information
    const nameInput = document.querySelector('input[placeholder="Enter your name"]');
    const phoneInput = document.querySelector('input[placeholder="Enter your phone number"]');
    const addressInput = document.querySelector('input[placeholder="Enter your full address"]');

    if (!nameInput.value || !phoneInput.value || !addressInput.value) {
        showNotification('Please fill all delivery information fields', 'error');
        return;
    }

    // Validate payment method
    const codRadio = document.getElementById('cod');
    const onlineRadio = document.getElementById('online');
    if (!codRadio.checked && !onlineRadio.checked) {
        showNotification('Please select a payment method', 'error');
        return;
    }

    if (onlineRadio.checked) {
        const cardNumber = document.querySelector('input[placeholder="1234 5678 9012 3456"]').value;
        const expiryDate = document.querySelector('input[placeholder="MM/YY"]').value;
        const cvv = document.querySelector('input[placeholder="123"]').value;

        if (!cardNumber || !expiryDate || !cvv) {
            showNotification('Please fill all payment details', 'error');
            return;
        }

        // TODO: Integrate with payment gateway (e.g., Stripe, PayPal)
        // Example: const paymentResult = await processPayment({ cardNumber, expiryDate, cvv });
        showNotification('Processing payment...', 'info');
    }

    // Submit order to backend
    const order = {
        items: cartItems,
        deliveryInfo: {
            name: nameInput.value,
            phone: phoneInput.value,
            address: addressInput.value
        },
        paymentMethod: codRadio.checked ? 'cod' : 'online',
        total: parseFloat(document.querySelector('.flex.justify-between p.text-orange-500').textContent.replace('$', ''))
    };

    // TODO: Send order to backend API
    // Example: await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });

    const orderNumber = Math.floor(Math.random() * 1000000);
    showNotification(`Order #${orderNumber} placed successfully!`, 'success');
    
    // Clear cart and reset form
    clearCart();
    nameInput.value = '';
    phoneInput.value = '';
    addressInput.value = '';
    document.querySelector('textarea[placeholder="E.g., Call before delivery"]').value = '';
    if (onlineRadio.checked) {
        document.querySelector('input[placeholder="1234 5678 9012 3456"]').value = '';
        document.querySelector('input[placeholder="MM/YY"]').value = '';
        document.querySelector('input[placeholder="123"]').value = '';
    }
}

/**
 * Update the cart UI elements
 */
function updateCartUI() {
    if (cartCountElement) {
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
    
    if (window.location.pathname.includes('#cart')) {
        displayCartItems();
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
    
    localStorage.setItem('foodieAppDarkMode', darkModeEnabled);
    
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
    const savedDarkMode = localStorage.getItem('foodieAppDarkMode');
    
    if (savedDarkMode !== null) {
        if (savedDarkMode === 'true') {
            darkModeEnabled = true;
            document.body.classList.add('dark-mode');
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        darkModeEnabled = true;
        document.body.classList.add('dark-mode');
    }
    
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
    const notification = document.createElement('div');
    
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
    
    document.body.appendChild(notification);
    
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
    
    const form = event.target;
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const addressInput = form.querySelector('textarea[name="address"]');
    
    if (!nameInput.value || !emailInput.value || !addressInput.value) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    const orderNumber = Math.floor(Math.random() * 1000000);
    showNotification('Order placed successfully!', 'success');
    
    clearCart();
    
    const orderConfirmation = document.getElementById('order-confirmation');
    if (orderConfirmation) {
        orderConfirmation.classList.remove('hidden');
        document.getElementById('order-number').textContent = orderNumber;
        
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
    
    showNotification('Thank you for subscribing!', 'success');
    emailInput.value = '';
}

/**
 * Play video (placeholder function)
 * @param {string} videoId - ID of the video to play
 */
function playVideo(videoId) {
    showNotification(`Playing video: ${videoId}`, 'info');
}

/**
 * Submit contact form
 * @param {Event} event - Form submission event
 */
function submitContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const messageInput = form.querySelector('textarea[name="message"]');
    
    if (!nameInput.value || !emailInput.value || !messageInput.value) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    showNotification('Your message has been sent!', 'success');
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