// Zayn Shop BD — Pre-Order E-Commerce Engine
// High-Converting, Lightweight, Zero-Hosting Architecture

let allProducts = [];
let cart = [];
let activeCategory = 'all';
let currentProduct = null;
let deliveryArea = 'dhaka'; // 'dhaka' or 'outside'

// Pre-load saved delivery area from localStorage if available
try {
  const savedArea = localStorage.getItem('zayn_delivery_area');
  if (savedArea === 'dhaka' || savedArea === 'outside') {
    deliveryArea = savedArea;
  }
} catch (_) {}

// ---- Tracking Initialization (Meta Pixel & GTM) ----
function initTracking() {
  window.dataLayer = window.dataLayer || [];

  // 1. Meta Pixel
  if (typeof CONFIG !== 'undefined' && CONFIG.metaPixelId) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CONFIG.metaPixelId);
    fbq('track', 'PageView');
  }

  // 2. Google Tag Manager
  if (typeof CONFIG !== 'undefined' && CONFIG.gtmId) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',CONFIG.gtmId);
  }

  // PageView dataLayer push
  dataLayer.push({ event: 'page_view', page_title: document.title, page_location: window.location.href });
}

function trackEvent(name, params = {}) {
  console.log(`[Tracking Event] ${name}:`, params);

  // Meta Pixel
  if (window.fbq) {
    fbq('track', name, params);
  }

  // GTM / dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

// ---- Universal Product Loader (Google Sheet Sync with Local Fallback) ----
async function fetchStoreProducts() {
  // 1. Try Google Sheet Webhook if configured
  if (typeof CONFIG !== 'undefined' && CONFIG.orderWebhookUrl) {
    try {
      const res = await fetch(CONFIG.orderWebhookUrl);
      const sheetProducts = await res.json();
      if (Array.isArray(sheetProducts) && sheetProducts.length > 0) {
        try {
          sessionStorage.setItem('zayn_cached_products', JSON.stringify(sheetProducts));
        } catch (_) {}
        return sheetProducts;
      }
    } catch (sheetErr) {
      console.warn('Google Sheet product fetch failed, fallback to local products.json:', sheetErr);
    }
  }

  // 2. Check session cache
  try {
    const cached = sessionStorage.getItem('zayn_cached_products');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  // 3. Fallback to local products.json
  const res = await fetch('products.json');
  return await res.json();
}

// ---- Load Products & Render ----
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  try {
    allProducts = await fetchStoreProducts();
    
    // Check if category is passed via URL query
    const urlParams = new URLSearchParams(window.location.search);
    const catQuery = urlParams.get('cat');
    if (catQuery && (catQuery === 'all' || allProducts.some(p => p.category === catQuery))) {
      activeCategory = catQuery;
    }

    renderCategoryNav();
    renderCategoryPills();
    if (grid) renderProducts();
  } catch (err) {
    console.error('Failed to load products:', err);
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444">Failed to load products. Please refresh the page.</p>';
  }
}

function renderCategoryNav() {
  const container = document.getElementById('categoryNavInner');
  if (!container) return;

  const categories = [
    { id: 'all', name: 'All Products', icon: '✨' },
    { id: 'Jewelry & Accessories', name: 'Jewelry & Accessories', icon: '💎' },
    { id: 'Cute & Toys', name: 'Cute & Toys', icon: '🧸' },
    { id: 'Beauty & Skincare', name: 'Beauty & Skincare', icon: '💄' },
    { id: 'Home & Living', name: 'Home & Living', icon: '🏡' },
    { id: 'Fashion & Wear', name: 'Fashion & Wear', icon: '👗' }
  ];

  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');

  container.innerHTML = categories.map(cat => {
    const isActive = cat.id === activeCategory;
    if (isHome) {
      return `<a href="javascript:void(0)" class="category-nav-link ${isActive ? 'active' : ''}" onclick="setCategory('${cat.id}')"><span>${cat.icon}</span> <span>${cat.name}</span></a>`;
    } else {
      return `<a href="index.html?cat=${encodeURIComponent(cat.id)}" class="category-nav-link ${isActive ? 'active' : ''}"><span>${cat.icon}</span> <span>${cat.name}</span></a>`;
    }
  }).join('');
}

function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  const categories = ['all', ...new Set(allProducts.map(p => p.category))];

  container.innerHTML = categories.map(cat => `
    <button class="cat-pill ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
      ${cat === 'all' ? '✨ All Products (' + allProducts.length + ')' : escapeHtml(cat)}
    </button>
  `).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  renderCategoryNav();
  renderCategoryPills();
  renderProducts();

  // Scroll gently toward product grid if user is high up on the page
  const grid = document.getElementById('productGrid');
  if (grid && window.scrollY > 450) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchQuery')?.value.toLowerCase().trim() || '';

  const filtered = allProducts.filter(p => {
    const pCat = (p.category || '').toLowerCase();
    const aCat = activeCategory.toLowerCase();
    const matchCat = activeCategory === 'all' || 
      p.category === activeCategory || 
      aCat.includes(pCat) || 
      pCat.includes(aCat) ||
      (aCat.split(' ')[0] && pCat.includes(aCat.split(' ')[0]));
    const matchSearch = !searchInput || p.name.toLowerCase().includes(searchInput) || (p.description && p.description.toLowerCase().includes(searchInput));
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#64748b"><h3>No products found!</h3><p>Try searching with different keywords.</p></div>';
    return;
  }

  const currency = typeof CONFIG !== 'undefined' ? CONFIG.currencySymbol : '৳';
  const deliveryTime = typeof CONFIG !== 'undefined' ? CONFIG.deliveryTime : '15–25 Days';

  grid.innerHTML = filtered.map(p => {
    const discount = p.regular_price && p.regular_price > p.price 
      ? Math.round(((p.regular_price - p.price) / p.regular_price) * 100) 
      : 0;

    return `
    <div class="product-card" onclick="window.location='product.html?id=${p.id}'" style="cursor:pointer">
      <div class="prod-img-wrap">
        <span class="badge-preorder">Pre-Order (${deliveryTime})</span>
        ${discount > 0 ? `<span class="badge-discount">${discount}% off</span>` : ''}
        <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" class="prod-img" onerror="this.onerror=null;this.src='images/hero_banner.jpg';">
      </div>
      <div class="prod-body">
        <div class="prod-cat">${escapeHtml(p.category)}</div>
        <h3 class="prod-title">${escapeHtml(p.name)}</h3>
        <div class="prod-price-row">
          <span class="price-current">${currency}${p.price.toLocaleString()}</span>
          ${p.regular_price ? `<span class="price-old">${currency}${p.regular_price.toLocaleString()}</span>` : ''}
        </div>
        <div class="prod-actions" onclick="event.stopPropagation()">
          <button class="btn-card-cart" onclick="addToCart(${p.id}, 1, true)">
            🛒 Add to Bag
          </button>
          <button class="btn-card-buy" onclick="openDirectCheckout(${p.id})">
            ⚡ Order Now
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ---- Cart Management ----
function loadCart() {
  try {
    const raw = localStorage.getItem('zayn_cart');
    if (!raw) {
      cart = [];
    } else if (raw.startsWith('[') || raw.startsWith('{')) {
      cart = JSON.parse(raw);
    } else {
      // Legacy base64 decoding with safe UTF-8 fallback
      try {
        cart = JSON.parse(decodeURIComponent(escape(atob(raw))));
      } catch (_) {
        cart = JSON.parse(atob(raw));
      }
    }
    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch (e) {
    console.warn('Could not parse cart from localStorage:', e);
    cart = [];
  }
  updateCartBadge();
  renderCartItems();
  if (typeof renderCheckoutItems === 'function') {
    renderCheckoutItems();
  }
}

function saveCart() {
  try {
    localStorage.setItem('zayn_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
  updateCartBadge();
  renderCartItems();
  if (typeof renderCheckoutItems === 'function') {
    renderCheckoutItems();
  }
}

// Immediately load cart into memory on script evaluation
loadCart();

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const badgeEls = document.querySelectorAll('.cart-badge-count');
  badgeEls.forEach(el => {
    el.textContent = totalCount;
    el.style.display = totalCount > 0 ? 'inline-block' : 'none';
  });
}

async function ensureProductsLoaded() {
  if (!allProducts.length) {
    try {
      allProducts = await fetchStoreProducts();
    } catch (e) {
      console.error('Failed to fetch products for cart item lookup', e);
    }
  }
}

function addToCart(productId, qty = 1, openDrawer = true) {
  function doAdd(p) {
    if (!p) return;

    const existing = cart.find(item => Number(item.id) === Number(productId));
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        regular_price: p.regular_price || 0,
        image: p.image,
        category: p.category,
        qty: qty
      });
    }

    saveCart();

    // Track AddToCart
    trackEvent('AddToCart', {
      content_name: p.name,
      content_ids: [String(p.id)],
      content_type: 'product',
      value: p.price * qty,
      currency: 'BDT'
    });

    showToast(`✅ "${p.name}" added to bag!`);

    if (openDrawer) {
      openCartDrawer();
    }
  }

  // Fast path: if products are already cached in memory, add synchronously without any async delay
  const existingProduct = allProducts.find(item => Number(item.id) === Number(productId));
  if (existingProduct) {
    doAdd(existingProduct);
    return Promise.resolve(existingProduct);
  }

  // Fallback: fetch products if not yet in memory
  return ensureProductsLoaded().then(() => {
    const p = allProducts.find(item => Number(item.id) === Number(productId));
    doAdd(p);
    return p;
  });
}

function openDirectCheckout(productId, qty = 1) {
  // Add item to cart and navigate immediately to order.html
  Promise.resolve(addToCart(productId, qty, false)).then(() => {
    window.location.href = 'order.html';
  });
}

function updateCartItemQty(id, delta) {
  const item = cart.find(i => Number(i.id) === Number(id));
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => Number(i.id) !== Number(id));
  }
  saveCart();
}

function openCartDrawer() {
  renderCartItems();
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function setDeliveryArea(area) {
  deliveryArea = area;
  try {
    localStorage.setItem('zayn_delivery_area', area);
  } catch (_) {}
  renderCartItems();
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  if (!list) return;

  const currency = typeof CONFIG !== 'undefined' ? CONFIG.currencySymbol : '৳';
  const deliveryDhaka = typeof CONFIG !== 'undefined' ? CONFIG.deliveryDhaka : 70;
  const deliveryOutside = typeof CONFIG !== 'undefined' ? CONFIG.deliveryOutside : 130;

  if (!cart.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:#94a3b8">
        <div style="font-size:48px;margin-bottom:12px">🛒</div>
        <h4>Your bag is empty!</h4>
        <p style="font-size:13px;margin-top:6px">Add your favorite items to bag.</p>
      </div>`;
    const footer = document.getElementById('cartFooter');
    if (footer) footer.style.display = 'none';
    return;
  }

  const footer = document.getElementById('cartFooter');
  if (footer) footer.style.display = 'block';

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <div class="cart-item-price">${currency}${item.price.toLocaleString()} × ${item.qty}</div>
        <div class="qty-control">
          <button onclick="updateCartItemQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartItemQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="updateCartItemQty(${item.id}, -9999)" title="Remove item">✕</button>
    </div>
  `).join('');

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = deliveryArea === 'dhaka' ? deliveryDhaka : deliveryOutside;
  const total = subtotal + delivery;

  const subtotalEl = document.getElementById('cartSubtotal');
  const deliveryEl = document.getElementById('cartDelivery');
  const totalEl = document.getElementById('cartTotal');

  if (subtotalEl) subtotalEl.textContent = `${currency}${subtotal.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `${currency}${delivery}`;
  if (totalEl) totalEl.textContent = `${currency}${total.toLocaleString()}`;
}

// ---- Utility Helpers ----
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ---- Init on DOM Ready ----
window.addEventListener('DOMContentLoaded', () => {
  initTracking();
  loadCart();
  loadProducts();

  // Live search filtering
  document.getElementById('searchQuery')?.addEventListener('input', () => {
    renderProducts();
  });
});
