document.addEventListener('DOMContentLoaded', function() {
    // Load products from JSON
    fetch('js/products.json')
        .then(response => response.json())
        .then(data => {
            const products = data.products;
            const productsContainer = document.getElementById('products-container');
            
            // Render products
            function renderProducts(category = 'all') {
                productsContainer.innerHTML = '';
                
                const filteredProducts = category === 'all' 
                    ? products 
                    : products.filter(product => product.category === category);
                
                filteredProducts.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = `product-card ${product.category}`;
                    
                    // Badge HTML if exists
                    const badgeHTML = product.badge 
                        ? `<div class="badge">${product.badge}</div>` 
                        : '';
                    
                    // Category badge
                    const categoryBadge = `<div class="product-badge">${product.category}</div>`;
                    
                    // Specs HTML
                    const specsHTML = product.specs.map(spec => `
                        <li>
                            <i class="${spec.icon}"></i> <strong>${spec.text}</strong>
                        </li>
                    `).join('');
                    
                    productCard.innerHTML = `
                        <div class="product-header">
                            ${badgeHTML}
                            ${categoryBadge}
                            <h3>${product.name}</h3>
                            <div class="price">Rp${product.price.toLocaleString('id-ID')} </div>
                        </div>
                        <div class="product-body">
                            <ul class="product-specs">
                                ${specsHTML}
                            </ul>
                            <div class="product-actions">
                                <button class="btn btn-outline detail-btn" data-id="${product.id}">
                                    <i class="fas fa-info-circle"></i> Detail
                                </button>
                                <button class="btn btn-primary add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                                    <i class="fas fa-cart-plus"></i> Pesan
                                </button>
                            </div>
                        </div>
                    `;
                    
                    productsContainer.appendChild(productCard);
                });
                
                // Add event listeners to new buttons
                addEventListeners();
            }
            
            // Initial render
            renderProducts();
            
            // Category tabs functionality
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    const category = button.getAttribute('data-category');
                    renderProducts(category);
                });
            });
        })
        .catch(error => console.error('Error loading products:', error));
    
    // Cart functionality
    let cart = {};
    let currentDetailProductId = null;
    let discountRate = 0;
    const validCoupons = {
        "DINZID": 0.2, // 20% discount
        "YOIMIYA": 0.1, // 10% discount
        "PREMIUM10": 0.1 // 10% discount
    };
    
    // DOM Elements
    const cartModal = document.getElementById('cart-modal');
    const detailModal = document.getElementById('detail-modal');
    const openCartBtn = document.getElementById('open-cart');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const closeDetailBtn = document.querySelector('.close-detail');
    const cartCount = document.getElementById('cart-count');
    const cartEmpty = document.getElementById('cart-empty');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    const clearCartBtn = document.getElementById('clear-cart');
    const checkoutBtn = document.getElementById('checkout');
    const customerName = document.getElementById('customer-name');
    const couponCode = document.getElementById('coupon-code');
    const applyCouponBtn = document.getElementById('apply-coupon');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const browseProductsBtn = document.getElementById('browse-products');
    const floatingParticles = document.getElementById('floating-particles');
    const headerParticles = document.getElementById('particles');
    const navbar = document.querySelector('.navbar');
    const navbarToggle = document.querySelector('.navbar-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    // Create floating particles
    function createParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = container === floatingParticles ? 'floating-particle' : 'particle';
            
            // Random size
            const size = Math.random() * 5 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random opacity
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            // Random animation duration
            const duration = Math.random() * 20 + 10;
            particle.style.animationDuration = `${duration}s`;
            
            // Random delay
            particle.style.animationDelay = `${Math.random() * 10}s`;
            
            container.appendChild(particle);
        }
    }
    
    // Format currency
    const formatCurrency = (amount) => {
        return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    
    // Update cart count
    const updateCartCount = () => {
        let count = 0;
        for (const id in cart) {
            count += cart[id].quantity;
        }
        cartCount.textContent = count;
        
        // Animate cart count when changed
        if (count > 0) {
            cartCount.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 300);
        }
    };
    
    // Update cart UI
    const updateCart = () => {
        // Clear existing items
        cartItems.innerHTML = '';
        
        let subtotal = 0;
        
        // Add items to cart
        for (const id in cart) {
            const item = cart[id];
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)} </div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${id}">+</button>
                </div>
                <button class="remove-item" data-id="${id}"><i class="fas fa-trash"></i></button>
            `;
            cartItems.appendChild(itemEl);
        }
        
        // Calculate totals
        const discount = subtotal * discountRate;
        const total = subtotal - discount;
        
        // Update totals display
        subtotalEl.textContent = formatCurrency(subtotal);
        discountEl.textContent = formatCurrency(discount);
        totalEl.textContent = formatCurrency(total);
        
        // Show/hide empty cart message
        if (Object.keys(cart).length === 0) {
            cartEmpty.style.display = 'block';
            cartContent.style.display = 'none';
        } else {
            cartEmpty.style.display = 'none';
            cartContent.style.display = 'block';
        }
        
        updateCartCount();
    };
    
    // Add to cart
    const addToCart = (id, name, price) => {
        if (cart[id]) {
            cart[id].quantity += 1;
        } else {
            cart[id] = {
                name: name,
                price: price,
                quantity: 1
            };
        }
        
        updateCart();
        showNotification(`${name} telah ditambahkan ke keranjang`);
        
        // Animate cart button
        openCartBtn.classList.add('animate-pulse');
        setTimeout(() => {
            openCartBtn.classList.remove('animate-pulse');
        }, 1000);
    };
    
    // Remove from cart
    const removeFromCart = (id) => {
        if (cart[id]) {
            delete cart[id];
            updateCart();
            showNotification('Produk telah dihapus dari keranjang', true);
        }
    };
    
    // Update quantity
    const updateQuantity = (id, change) => {
        if (cart[id]) {
            cart[id].quantity += change;
            
            if (cart[id].quantity <= 0) {
                removeFromCart(id);
            } else {
                updateCart();
            }
        }
    };
    
    // Show notification
    const showNotification = (message, isError = false) => {
        notificationMessage.textContent = message;
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    };
    
    // Show product detail
    const showProductDetail = (id) => {
        fetch('js/products.json')
            .then(response => response.json())
            .then(data => {
                const product = data.products.find(p => p.id == id);
                if (!product) return;
                
                currentDetailProductId = id;
                
                const detailContent = document.getElementById('detail-content');
                const specsHTML = product.specs.map(spec => `
                    <li style="padding: 0.8rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center;">
                        <i class="${spec.icon}" style="color: var(--accent); margin-right: 1rem; font-size: 1.1rem;"></i> 
                        <span>${spec.text}</span>
                    </li>
                `).join('');
                
                detailContent.innerHTML = `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--accent); font-size: 1.8rem;">${product.name}</h3>
                        <div class="price" style="font-size: 1.8rem; margin-bottom: 1.5rem; font-weight: bold;">${formatCurrency(product.price)} <span style="font-size: 1rem; opacity: 0.8;"></span></div>
                        <p style="margin-bottom: 2rem; line-height: 1.8; opacity: 0.9;">${product.description}</p>
                        
                        <h4 style="margin-bottom: 1rem; font-size: 1.3rem; color: var(--accent);">Spesifikasi:</h4>
                        <ul style="list-style-type: none; margin-bottom: 2rem;">
                            ${specsHTML}
                        </ul>
                    </div>
                `;
                
                document.getElementById('detail-title').textContent = product.name;
                showModal(detailModal);
            });
    };
    
    // Apply coupon
    const applyCoupon = () => {
        const code = couponCode.value.trim().toUpperCase();
        
        if (!code) {
            showNotification('Masukkan kode kupon', true);
            return;
        }
        
        if (validCoupons[code]) {
            discountRate = validCoupons[code];
            updateCart();
            showNotification(`Kupon berhasil diterapkan! Diskon ${discountRate * 100}%`);
        } else {
            discountRate = 0;
            updateCart();
            showNotification('Kode kupon tidak valid', true);
        }
    };
    
    // Checkout via WhatsApp
    const checkout = () => {
        const name = customerName.value.trim();
        
        if (!name) {
            showNotification('Masukkan nama penerima', true);
            return;
        }
        
        if (Object.keys(cart).length === 0) {
            showNotification('Keranjang belanja kosong', true);
            return;
        }
        
        // Build WhatsApp message
        let message = `Halo, saya ingin memesan Panel Pterodactyl:\n\n`;
        message += `Nama: *${name}*\n\n`;
        message += `*Detail Pesanan:*\n`;
        
        for (const id in cart) {
            const item = cart[id];
            message += `➤ ${item.name} (${formatCurrency(item.price)} x ${item.quantity}) = ${formatCurrency(item.price * item.quantity)}\n`;
        }
        
        message += `\n*Ringkasan Pembayaran:*\n`;
        message += `Subtotal: ${subtotalEl.textContent}\n`;
        message += `Diskon: ${discountEl.textContent}\n`;
        message += `*Total: ${totalEl.textContent}*\n\n`;
        
        if (couponCode.value) {
            message += `Kode Kupon: ${couponCode.value}\n\n`;
        }
        
        message += `Mohon info lebih lanjut mengenai pembayaran. Terima kasih!`;
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Open WhatsApp
        window.open(`https://t.me/dikxz_store?text=${encodedMessage}`, '_blank');
        
        // Close modal
        hideModal(cartModal);
    };
    
    // Show modal with animation
    const showModal = (modal) => {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    };
    
    // Hide modal with animation
    const hideModal = (modal) => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };
    
    // Add event listeners to dynamic elements
    function addEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                const price = parseInt(e.target.getAttribute('data-price'));
                addToCart(id, name, price);
            });
        });
        
        // Detail buttons
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                showProductDetail(id);
            });
        });
    }
    
    // Initialize cart
    updateCart();
    
    // Create particles
    createParticles(floatingParticles, 50);
    createParticles(headerParticles, 30);
    
    // Open cart modal
    openCartBtn.addEventListener('click', () => {
        showModal(cartModal);
    });
    
    // Browse products button
    browseProductsBtn.addEventListener('click', () => {
        hideModal(cartModal);
        scrollToSection('#products');
    });
    
    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            hideModal(modal);
        });
    });
    
    // Close detail modal
    closeDetailBtn.addEventListener('click', () => {
        hideModal(detailModal);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            hideModal(cartModal);
        }
        if (e.target === detailModal) {
            hideModal(detailModal);
        }
    });
    
    // Add to cart from detail modal
    document.querySelector('.add-to-cart-from-detail').addEventListener('click', () => {
        if (currentDetailProductId) {
            fetch('js/products.json')
                .then(response => response.json())
                .then(data => {
                    const product = data.products.find(p => p.id == currentDetailProductId);
                    if (product) {
                        addToCart(product.id, product.name, product.price);
                        hideModal(detailModal);
                    }
                });
        }
    });
    
    // Cart item quantity and removal (delegated events)
    cartItems.addEventListener('click', (e) => {
        // Decrease quantity
        if (e.target.classList.contains('decrease') || e.target.parentElement.classList.contains('decrease')) {
            const btn = e.target.classList.contains('decrease') ? e.target : e.target.parentElement;
            const id = btn.getAttribute('data-id');
            updateQuantity(id, -1);
        }
        
        // Increase quantity
        if (e.target.classList.contains('increase') || e.target.parentElement.classList.contains('increase')) {
            const btn = e.target.classList.contains('increase') ? e.target : e.target.parentElement;
            const id = btn.getAttribute('data-id');
            updateQuantity(id, 1);
        }
        
        // Remove item
        if (e.target.classList.contains('remove-item') || e.target.parentElement.classList.contains('remove-item')) {
            const btn = e.target.classList.contains('remove-item') ? e.target : e.target.parentElement;
            const id = btn.getAttribute('data-id');
            removeFromCart(id);
        }
    });
    
    // Clear cart
    clearCartBtn.addEventListener('click', () => {
        cart = {};
        discountRate = 0;
        couponCode.value = '';
        updateCart();
        showNotification('Keranjang telah dikosongkan', true);
    });
    
    // Apply coupon
    applyCouponBtn.addEventListener('click', applyCoupon);
    
    // Checkout
    checkoutBtn.addEventListener('click', checkout);
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    navbarToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('show');
    });
    
    // Smooth scrolling for navigation links
    function scrollToSection(selector) {
        const section = document.querySelector(selector);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            // Update active link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            
            // Scroll to section
            scrollToSection(target);
            
            // Close mobile menu if open
            if (mobileMenu.classList.contains('show')) {
                mobileMenu.classList.remove('show');
            }
        });
    });
    
    // Scroll effects
    const scrollElements = document.querySelectorAll('.scroll-effect');
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };
    
    const displayScrollElement = (element) => {
        element.classList.add('active');
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };
    
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
    
    // Initialize - check for elements already in view on page load
    handleScrollAnimation();
});
