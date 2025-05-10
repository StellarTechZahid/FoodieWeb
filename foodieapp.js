/**
 * FoodieApp JavaScript Functionality - Supports Dropdown Filter and New Card Design
 * This file contains the interactive functionality for the FoodieApp website
 */

// Global Variables
let cartItems = [];
let darkModeEnabled = false;

// DOM Elements
let cartCountElement;
let mobileMenu;
let allTabs;
let proceedToCartButton;

/**
 * Wait for the DOM to be fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    cartCountElement = document.getElementById('cart-count');
    mobileMenu = document.getElementById('mobile-menu');
    allTabs = document.querySelectorAll('.tab-content');
    
    // Create and append "Proceed to Cart" button if on menu tab
    if (document.getElementById('menu-tab')) {
        createProceedToCartButton();
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load cart from local storage
    loadCartFromStorage();
    
    // Check user's preferred color scheme
    checkUserColorScheme();

    // Initialize cart tab if cart-tab exists
    if (document.getElementById('cart-tab')) {
        displayCartItems();
    }
});

/**
 * Create and append the "Proceed to Cart" button
 */
function createProceedToCartButton() {
    const container = document.getElementById('proceed-to-cart-container');
    
    if (container) {
        proceedToCartButton = document.createElement('button');
        proceedToCartButton.id = 'proceed-to-cart-btn';
        proceedToCartButton.className = 'mt-4 md:mt-0 w-full md:w-auto bg-orange-500 text-white py-3 px-6 rounded-lg shadow hover:bg-orange-600 transition duration-300 flex items-center justify-center';
        proceedToCartButton.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Proceed to Cart';
        proceedToCartButton.addEventListener('click', function() {
            showTab('cart');
        });
        
        // Initially hide if cart is empty
        if (cartItems.length === 0) {
            proceedToCartButton.classList.add('hidden');
        }
        
        container.appendChild(proceedToCartButton);
    }
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Menu toggle for mobile
    const menuIcon = document.getElementById('menu-icon');
    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMobileMenu);
    }

    // Category filter dropdown
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterMenuByCategory(this.value);
        });
    }

    // Add to cart buttons (use delegation to handle dynamic elements)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart-btn')) {
            const button = e.target.closest('.add-to-cart-btn');
            e.preventDefault();
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name');
            const productPrice = parseFloat(button.getAttribute('data-product-price'));
            
            // Add to cart
            addToCart(productId, productName, productPrice, 1);
            
            // Update button text to show "Added to Cart"
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check mr-1"></i>Added to Cart';
            button.classList.add('text-green-500');
            button.classList.remove('text-orange-500');
            button.disabled = true;
            
            // Revert button after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('text-green-500');
                button.classList.add('text-orange-500');
                button.disabled = false;
            }, 2000);
        }
    });

    // Cart tab specific event listeners
    if (document.getElementById('cart-tab')) {
        // Payment method toggle
        const codRadio = document.getElementById('cod');
        const onlineRadio = document.getElementById('online');
        const onlinePaymentFields = document.getElementById('online-payment-fields');
        const jazzCashFields = document.getElementById('jazzcash-fields');
        const easyPaisaFields = document.getElementById('easypaisa-fields');
        const cardFields = document.getElementById('card-fields');
        
        if (codRadio && onlineRadio && onlinePaymentFields) {
            codRadio.addEventListener('change', () => {
                onlinePaymentFields.classList.add('hidden');
            });
            
            onlineRadio.addEventListener('change', () => {
                onlinePaymentFields.classList.remove('hidden');
            });
        }
        
        // Payment method selection
        const paymentMethods = document.querySelectorAll('input[name="online-payment-method"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                if (jazzCashFields) jazzCashFields.classList.add('hidden');
                if (easyPaisaFields) easyPaisaFields.classList.add('hidden');
                if (cardFields) cardFields.classList.add('hidden');
                
                const selectedMethod = this.value;
                if (selectedMethod === 'jazzcash' && jazzCashFields) {
                    jazzCashFields.classList.remove('hidden');
                } else if (selectedMethod === 'easypaisa' && easyPaisaFields) {
                    easyPaisaFields.classList.remove('hidden');
                } else if (selectedMethod === 'card' && cardFields) {
                    cardFields.classList.remove('hidden');
                }
            });
        });

        // Promo code button
        const promoButton = document.getElementById('apply-promo-btn');
        if (promoButton) {
            promoButton.addEventListener('click', applyPromo);
        }

        // Checkout button
        const checkoutButton = document.getElementById('checkout-btn');
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
 * Add an item to the shopping cart
 * @param {string} id - Product ID
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {number} quantity - Quantity to add
 */
function addToCart(id, name, price, quantity) {
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
    
    if (proceedToCartButton) {
        proceedToCartButton.classList.remove('hidden');
    }
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
        
        if (cartItems.length === 0 && proceedToCartButton) {
            proceedToCartButton.classList.add('hidden');
        }
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
 * Display cart items in the cart tab
 */
function displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (!cartContainer || !emptyCartMessage) {
        return;
    }
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = '';
        emptyCartMessage.classList.remove('hidden');
        updateCartTotals();
        return;
    }

    emptyCartMessage.classList.add('hidden');
    cartContainer.innerHTML = cartItems.map(item => `
        <div class="flex items-center justify-between border-b pb-4 mb-4">
            <div class="flex items-center space-x-4">
                <div class="w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
                    <span class="text-gray-600 dark:text-gray-400">Item Image</span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">${item.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400">$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-6">
                <div class="flex items-center space-x-2">
                    <button 
                        class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition duration-300 minus-btn"
                        data-id="${item.id}"
                    >
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="text-gray-800 dark:text-gray-200 font-medium text-lg">${item.quantity}</span>
                    <button 
                        class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-orange-500 hover:text-white transition duration-300 plus-btn"
                        data-id="${item.id}"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <p class="text-gray-800 dark:text-gray-200 font-bold">$${(item.price * item.quantity).toFixed(2)}</p>
                <button 
                    class="text-red-500 hover:text-red-700 remove-btn"
                    data-id="${item.id}"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Reattach event listeners for quantity and remove buttons
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            updateCartItemQuantity(id, cartItems.find(item => item.id === id).quantity - 1);
        });
    });

    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            updateCartItemQuantity(id, cartItems.find(item => item.id === id).quantity + 1);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            removeFromCart(id);
        });
    });

    updateCartTotals();
}

/**
 * Update cart totals (subtotal, delivery, tax, total)
 */
function updateCartTotals() {
    const subtotalElement = document.getElementById('cart-subtotal');
    const deliveryFeeElement = document.getElementById('delivery-fee');
    const taxElement = document.getElementById('tax-amount');
    const totalElement = document.getElementById('cart-total');

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
    const promoInput = document.getElementById('promo-code-input');
    if (!promoInput) return;

    const promoCode = promoInput.value.trim();
    if (promoCode === 'FOODIE10') {
        const totalElement = document.getElementById('cart-total');
        const currentTotal = parseFloat(totalElement.textContent.replace('$', ''));
        const discountedTotal = currentTotal * 0.9; // 10% discount
        totalElement.textContent = `$${discountedTotal.toFixed(2)}`;
        showNotification('Promo code applied successfully!', 'success');
        promoInput.value = '';
        
        const summaryContainer = document.querySelector('.order-summary');
        if (summaryContainer) {
            const existingDiscount = summaryContainer.querySelector('.discount-row');
            if (existingDiscount) existingDiscount.remove();
            const discountElement = document.createElement('div');
            discountElement.className = 'flex justify-between py-2 discount-row';
            discountElement.innerHTML = `
                <p class="text-green-600">Discount (10%)</p>
                <p class="text-green-600">-$${(currentTotal * 0.1).toFixed(2)}</p>
            `;
            
            const totalRow = document.querySelector('.order-summary .border-t');
            summaryContainer.insertBefore(discountElement, totalRow);
        }
    } else {
        showNotification('Invalid promo code', 'error');
    }
}

/**
 * Validate and process checkout
 */
function proceedToCheckout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');

    if (!nameInput || !phoneInput || !addressInput || !nameInput.value || !phoneInput.value || !addressInput.value) {
        showNotification('Please fill all delivery information fields', 'error');
        return;
    }

    const codRadio = document.getElementById('cod');
    const onlineRadio = document.getElementById('online');
    if (!codRadio.checked && !onlineRadio.checked) {
        showNotification('Please select a payment method', 'error');
        return;
    }

    let paymentDetails = {
        method: codRadio.checked ? 'Cash on Delivery' : 'Online Payment'
    };

    if (onlineRadio.checked) {
        const selectedPaymentMethod = document.querySelector('input[name="online-payment-method"]:checked');
        
        if (!selectedPaymentMethod) {
            showNotification('Please select an online payment method', 'error');
            return;
        }
        
        paymentDetails.onlineMethod = selectedPaymentMethod.value;
        
        let validPayment = false;
        
        if (paymentDetails.onlineMethod === 'jazzcash') {
            const jazzCashNumber = document.getElementById('jazzcash-number');
            if (jazzCashNumber && jazzCashNumber.value) {
                paymentDetails.jazzCashNumber = jazzCashNumber.value;
                validPayment = true;
            } else {
                showNotification('Please enter JazzCash number', 'error');
            }
        } else if (paymentDetails.onlineMethod === 'easypaisa') {
            const easyPaisaNumber = document.getElementById('easypaisa-number');
            if (easyPaisaNumber && easyPaisaNumber.value) {
                paymentDetails.easyPaisaNumber = easyPaisaNumber.value;
                validPayment = true;
            } else {
                showNotification('Please enter EasyPaisa number', 'error');
            }
        } else if (paymentDetails.onlineMethod === 'card') {
            const cardNumber = document.getElementById('card-number');
            const expiryDate = document.getElementById('card-expiry');
            const cvv = document.getElementById('card-cvv');
            
            if (cardNumber && expiryDate && cvv && cardNumber.value && expiryDate.value && cvv.value) {
                paymentDetails.cardDetails = {
                    number: cardNumber.value,
                    expiry: expiryDate.value,
                    cvv: cvv.value
                };
                validPayment = true;
            } else {
                showNotification('Please fill all card details', 'error');
            }
        }
        
        if (!validPayment) return;
    }

    const orderTotal = document.getElementById('cart-total').textContent;  
    const notesInput = document.getElementById('order-notes');
    
    const order = {
        orderNumber: generateOrderNumber(),
        items: cartItems,
        customerInfo: {
            name: nameInput.value,
            phone: phoneInput.value,
            address: addressInput.value,
            notes: notesInput ? notesInput.value : ''
        },
        payment: paymentDetails,
        total: orderTotal
    };
    
    sendOrderViaWhatsApp(order);
    
    showNotification('Processing your order...', 'info');
    
    setTimeout(() => {
        showOrderConfirmation(order.orderNumber);
        clearCart();
    }, 2000);
}

/**
 * Generate random order number
 * @returns {string} Order number
 */
function generateOrderNumber() {
    return 'FD' + Math.floor(100000 + Math.random() * 900000);
}

/**
 * Send order information via WhatsApp
 * @param {Object} order - Order information
 */
function sendOrderViaWhatsApp(order) {
    let message = `🍔 *NEW ORDER #${order.orderNumber}* 🍔\n\n`;
    
    message += `*Customer Information*\n`;
    message += `Name: ${order.customerInfo.name}\n`;
    message += `Phone: ${order.customerInfo.phone}\n`;
    message += `Address: ${order.customerInfo.address}\n`;
    
    if (order.customerInfo.notes) {
        message += `Notes: ${order.customerInfo.notes}\n`;
    }
    
    message += `\n*Order Items*\n`;
    order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Payment Information*\n`;
    message += `Method: ${order.payment.method}\n`;
    
    if (order.payment.method === 'Online Payment') {
        message += `Payment Option: ${order.payment.onlineMethod}\n`;
    }
    
    message += `\n*Order Total: ${order.total}*`;
    
    const encodedMessage = encodeURIComponent(message);
    
    const businessPhone = '+923284161874'; // REPLACE WITH YOUR ACTUAL NUMBER
    const whatsappURL = `https://wa.me/${businessPhone}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

/**
 * Show order confirmation and hide order form
 * @param {string} orderNumber - The order number to display
 */
function showOrderConfirmation(orderNumber) {
    const orderForm = document.getElementById('order-form');
    const orderConfirmation = document.getElementById('order-confirmation');
    const orderNumberElement = document.getElementById('order-number');
    
    if (orderForm && orderConfirmation && orderNumberElement) {
        orderForm.classList.add('hidden');
        orderConfirmation.classList.remove('hidden');
        orderNumberElement.textContent = orderNumber;
        
        showNotification('Order placed successfully!', 'success');
        window.scrollTo(0, 0);
    }
}

/**
 * Update the cart UI elements
 */
function updateCartUI() {
    if (cartCountElement) {
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCountElement.classList.add('bg-orange-500', 'text-white');
        } else {
            cartCountElement.classList.remove('bg-orange-500', 'text-white');
        }
    }
    
    if (document.getElementById('cart-tab')) {
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
        
        if (proceedToCartButton && cartItems.length > 0) {
            proceedToCartButton.classList.remove('hidden');
        }
    }
}

/**
 * Clear the entire cart
 */
function clearCart() {
    cartItems = [];
    updateCartUI();
    saveCartToStorage();
    
    if (proceedToCartButton) {
        proceedToCartButton.classList.add('hidden');
    }
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
 * Filter menu items by category
 * @param {string} category - Category to filter by
 */
function filterMenuByCategory(category) {
    const categorySections = document.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
        const sectionCategory = section.getAttribute('data-category');
        if (category === 'all' || sectionCategory === category) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

/**
 * Search functionality (not used in current HTML, but included for future use)
 * @param {string} query - Search query
 */
function searchSite(query) {
    if (!query) {
        filterMenuByCategory('all');
        return;
    }
    
    const menuItems = document.querySelectorAll('.category-section .flex, .menu-card');
    let hasResults = false;
    
    menuItems.forEach(item => {
        const itemName = item.querySelector('h4')?.textContent.toLowerCase() || item.querySelector('h3')?.textContent.toLowerCase();
        const itemDescription = item.querySelector('p')?.textContent.toLowerCase();
        
        if (itemName && (itemName.includes(query.toLowerCase()) || (itemDescription && itemDescription.includes(query.toLowerCase())))) {
            item.parentElement.style.display = 'block';
            hasResults = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    if (!hasResults) {
        showNotification('No items found matching your search', 'info');
    }
}