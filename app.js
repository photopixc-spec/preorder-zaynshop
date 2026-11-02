// Zayn Shop BD — Pre-Order & E-Commerce Engine
// High-Converting, Lightweight, Zero-Hosting Architecture
// Version: 3.0 (Stale-While-Revalidate Caching, WebP CDN Proxy, Shimmer Skeleton, Abandoned Cart)

let allProducts = [];
let cart = [];
let activeCategory = 'all';
let currentProduct = null;
let deliveryArea = 'dhaka'; // 'dhaka' or 'outside'

// Price filter & sorting state
let filterMinPrice = null;
let filterMaxPrice = null;
let currentSortOrder = 'default'; // 'default', 'price-asc', 'price-desc', 'ready-stock'

// Cache configuration
const CACHE_KEY = 'zayn_catalog_cache';
const CACHE_TIME_KEY = 'zayn_catalog_timestamp';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Pre-load saved delivery area from localStorage if available
try {
  const savedArea = localStorage.getItem('zayn_delivery_area');
  if (savedArea === 'dhaka' || savedArea === 'outside') {
    deliveryArea = savedArea;
  }
} catch (_) {}

// ---- Phase 1: Global Image CDN Proxy & WebP Compression ----
function getOptimizedImageUrl(url, width = 600) {
  if (!url || typeof url !== 'string') return 'images/hero_banner.jpg';
  const trimmed = url.trim();
  if (!trimmed) return 'images/hero_banner.jpg';
  // Skip local paths, base64 data, blob URLs, or already wsrv.nl proxied URLs
  if (!/^https?:\/\//i.test(trimmed) || trimmed.includes('wsrv.nl')) {
    return trimmed;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=${width}&output=webp&q=85`;
}

// ---- Tracking Initialization (Meta Pixel & GTM / DataLayer) ----
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
  try {
    if (window.fbq) {
      fbq('track', name, params);
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  } catch (_) {}
}

// ---- Phase 1: Stale-While-Revalidate Universal Product Loader ----
async function fetchStoreProducts() {
  const urlParams = new URLSearchParams(window.location.search);
  const bypassCache = urlParams.get('nocache') === '1' || urlParams.get('refresh') === '1';

  // 1. Check local cache (Stale-While-Revalidate)
  if (!bypassCache) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timeStr = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && timeStr) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - Number(timeStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (age < CACHE_TTL) {
            // Cache is completely fresh (< 5 mins) -> Return immediately
            return parsed;
          } else {
            // Cache is stale (>= 5 mins) -> Return immediately for 0ms load, then revalidate in background!
            revalidateCatalogInBackground(parsed);
            return parsed;
          }
        }
      }
    } catch (cacheErr) {
      console.warn('Cache read error:', cacheErr);
    }
  }

  // 2. No valid cache or bypass requested: Fetch live from Google Sheets
  return await fetchFreshProductsFromSource();
}

// Fetch live from Webhook
async function fetchFreshProductsFromSource() {
  if (typeof CONFIG !== 'undefined' && CONFIG.orderWebhookUrl) {
    try {
      const sep = CONFIG.orderWebhookUrl.includes('?') ? '&' : '?';
      const res = await fetch(CONFIG.orderWebhookUrl + sep + 't=' + Date.now());
      if (res.ok) {
        const sheetProducts = await res.json();
        if (Array.isArray(sheetProducts) && sheetProducts.length > 0) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(sheetProducts));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          } catch (_) {}
          return sheetProducts;
        }
      }
    } catch (sheetErr) {
      console.warn('Google Sheet product fetch failed, falling back to local fallback:', sheetErr);
    }
  }

  // 3. Fallback to offline products.json only if remote Sheet is unreachable
  try {
    const resLocal = await fetch('products.json?v=' + Date.now());
    const localProducts = await resLocal.json();
    return Array.isArray(localProducts) ? localProducts : [];
  } catch (err) {
    console.error('All product fetch mechanisms failed:', err);
    return [];
  }
}

// Background revalidation without blocking DOM
async function revalidateCatalogInBackground(currentCached) {
  try {
    const fresh = await fetchFreshProductsFromSource();
    if (Array.isArray(fresh) && fresh.length > 0) {
      const isChanged = JSON.stringify(fresh) !== JSON.stringify(currentCached);
      if (isChanged) {
        allProducts = fresh;
        renderCategoryNav();
        renderCategoryPills();
        renderProducts();
        console.log('⚡ Zayn Catalog silently updated via background revalidation.');
      }
    }
  } catch (err) {
    console.warn('Background revalidation skipped:', err);
  }
}

// Force refresh catalog helper
async function forceRefreshCatalog() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    showToast('🔄 Refreshing catalog...');
    allProducts = await fetchFreshProductsFromSource();
    renderCategoryNav();
    renderCategoryPills();
    renderFilterToolbar();
    renderProducts();
    showToast('✅ Latest products loaded!');
  } catch (e) {
    showToast('Failed to refresh catalog');
  }
}
window.forceRefreshCatalog = forceRefreshCatalog;

// ---- Phase 2: Shimmer Skeleton Grid Loader ----
function renderShimmerSkeleton(grid, count = 6) {
  if (!grid) return;
  const skeletonCard = `
    <div class="skeleton-card">
      <div class="skeleton-shimmer skeleton-img"></div>
      <div class="skeleton-shimmer skeleton-line short"></div>
      <div class="skeleton-shimmer skeleton-line"></div>
      <div class="skeleton-shimmer skeleton-line medium"></div>
      <div class="skeleton-actions">
        <div class="skeleton-shimmer skeleton-btn"></div>
        <div class="skeleton-shimmer skeleton-btn"></div>
      </div>
    </div>
  `;
  grid.innerHTML = Array(count).fill(skeletonCard).join('');
}

// ---- Load Products & Render ----
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (grid) renderShimmerSkeleton(grid, 6);

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
    renderFilterToolbar();
    if (grid) renderProducts();
    checkAbandonedCart();
  } catch (err) {
    console.error('Failed to load products:', err);
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444">Failed to load products. Please refresh the page.</p>';
  }
}

function renderCategoryNav() {
  const container = document.getElementById('categoryNavInner');
  if (!container) return;

  const categoryIcons = {
    'all': '✨',
    'Beauty & Skincare': '💄',
    'Jewelry & Accessories': '💎',
    'Kids & Toys': '🧸',
    'Home & Living': '🏡',
    'Gifts': '🎁',
    'Winter Collection': '❄️',
    'DIY & Crafts': '🎨',
    'Bags & Pouches': '👜',
    'Pet Supplies': '🐾',
    'Stationery & Books': '📚'
  };

  const presentCats = [...new Set(allProducts.map(p => (p.category || '').trim()).filter(Boolean))];

  const navList = [
    { id: 'all', name: 'All Products', icon: '✨' },
    ...presentCats.map(cat => ({
      id: cat,
      name: cat,
      icon: categoryIcons[cat] || '🏷️'
    }))
  ];

  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('.html');

  container.innerHTML = navList.map(cat => {
    const isActive = cat.id === activeCategory;
    if (isHome) {
      return `<a href="javascript:void(0)" class="category-nav-link ${isActive ? 'active' : ''}" onclick="setCategory('${escapeHtml(cat.id)}')"><span>${cat.icon}</span> <span>${escapeHtml(cat.name)}</span></a>`;
    } else {
      return `<a href="index.html?cat=${encodeURIComponent(cat.id)}" class="category-nav-link ${isActive ? 'active' : ''}"><span>${cat.icon}</span> <span>${escapeHtml(cat.name)}</span></a>`;
    }
  }).join('');
}

function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  const categoryIcons = {
    'all': '✨',
    'Beauty & Skincare': '💄',
    'Jewelry & Accessories': '💎',
    'Kids & Toys': '🧸',
    'Home & Living': '🏡',
    'Gifts': '🎁',
    'Winter Collection': '❄️',
    'DIY & Crafts': '🎨',
    'Bags & Pouches': '👜',
    'Pet Supplies': '🐾',
    'Stationery & Books': '📚'
  };

  const presentCats = [...new Set(allProducts.map(p => (p.category || '').trim()).filter(Boolean))];
  const categories = ['all', ...presentCats];

  container.innerHTML = categories.map(cat => {
    const icon = categoryIcons[cat] || '🏷️';
    const count = cat === 'all' ? allProducts.length : allProducts.filter(p => (p.category || '').trim() === cat).length;
    return `
      <button class="cat-pill ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${escapeHtml(cat)}')">
        <span>${icon}</span> <span>${cat === 'all' ? 'All Products' : escapeHtml(cat)} (${count})</span>
      </button>
    `;
  }).join('');
}

function renderFilterToolbar() {
  const toolbarContainer = document.getElementById('filterToolbar');
  if (!toolbarContainer) return;

  toolbarContainer.innerHTML = `
    <div class="filter-toolbar-wrap">
      <div class="filter-toolbar-row">
        <div class="filter-group-left">
          <div class="filter-input-wrap">
            <span>Price:</span>
            <input type="number" id="filterMinPriceInput" class="filter-input-price" placeholder="Min ৳" oninput="handlePriceFilterChange()">
            <span>–</span>
            <input type="number" id="filterMaxPriceInput" class="filter-input-price" placeholder="Max ৳" oninput="handlePriceFilterChange()">
          </div>

          <select id="filterSortSelect" class="filter-select" onchange="handleSortChange(this.value)">
            <option value="default">Sort: Default / Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="ready-stock">🟢 Ready Stock First</option>
          </select>

          <button type="button" class="btn-filter-reset" onclick="resetAllFilters()">
            ↺ Reset
          </button>
        </div>

        <div class="filter-stats" id="filterStatsLabel">
          Showing ${allProducts.length} items
        </div>
      </div>
    </div>
  `;
}

function handlePriceFilterChange() {
  const minVal = document.getElementById('filterMinPriceInput')?.value;
  const maxVal = document.getElementById('filterMaxPriceInput')?.value;
  filterMinPrice = minVal !== '' && !isNaN(minVal) ? Number(minVal) : null;
  filterMaxPrice = maxVal !== '' && !isNaN(maxVal) ? Number(maxVal) : null;
  renderProducts();
}

function handleSortChange(val) {
  currentSortOrder = val || 'default';
  renderProducts();
}

function resetAllFilters() {
  activeCategory = 'all';
  filterMinPrice = null;
  filterMaxPrice = null;
  currentSortOrder = 'default';

  const q = document.getElementById('searchQuery');
  if (q) q.value = '';
  const minInp = document.getElementById('filterMinPriceInput');
  if (minInp) minInp.value = '';
  const maxInp = document.getElementById('filterMaxPriceInput');
  if (maxInp) maxInp.value = '';
  const sortSel = document.getElementById('filterSortSelect');
  if (sortSel) sortSel.value = 'default';

  renderCategoryNav();
  renderCategoryPills();
  renderProducts();
}

function setCategory(cat) {
  activeCategory = cat;
  renderCategoryNav();
  renderCategoryPills();
  renderProducts();

  const grid = document.getElementById('productGrid');
  if (grid && window.scrollY > 450) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function isProductInStock(p) {
  if (!p) return false;
  const badge = (p.badge || '').toLowerCase();
  const stockStatus = (p.stock_status || '').toLowerCase();
  return badge.includes('ready') || badge.includes('in stock') || stockStatus === 'in stock';
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchQuery')?.value.toLowerCase().trim() || '';

  let filtered = allProducts.filter(p => {
    // 1. Category filter
    const pCat = (p.category || '').toLowerCase();
    const aCat = activeCategory.toLowerCase();
    const matchCat = activeCategory === 'all' ||
      p.category === activeCategory ||
      aCat.includes(pCat) ||
      pCat.includes(aCat) ||
      (aCat.split(' ')[0] && pCat.includes(aCat.split(' ')[0]));

    // 2. Search query filter
    const matchSearch = !searchInput ||
      p.name.toLowerCase().includes(searchInput) ||
      (p.description && p.description.toLowerCase().includes(searchInput)) ||
      (p.category && p.category.toLowerCase().includes(searchInput));

    // 3. Price filter
    const price = Number(p.price) || 0;
    const matchMin = filterMinPrice === null || price >= filterMinPrice;
    const matchMax = filterMaxPrice === null || price <= filterMaxPrice;

    return matchCat && matchSearch && matchMin && matchMax;
  });

  // Sort
  if (currentSortOrder === 'price-asc') {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (currentSortOrder === 'price-desc') {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (currentSortOrder === 'ready-stock') {
    filtered.sort((a, b) => (isProductInStock(b) ? 1 : 0) - (isProductInStock(a) ? 1 : 0));
  }

  // Update Stats label
  const statsLabel = document.getElementById('filterStatsLabel');
  if (statsLabel) {
    statsLabel.textContent = `Showing ${filtered.length} of ${allProducts.length} items`;
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#64748b">
        <h3>No matching products found!</h3>
        <p style="margin:8px 0 16px;">Try adjusting your search terms or price filter.</p>
        <button type="button" class="btn-filter-reset" onclick="resetAllFilters()">Clear All Filters</button>
      </div>`;
    return;
  }

  const currency = typeof CONFIG !== 'undefined' ? CONFIG.currencySymbol : '৳';
  const deliveryTime = typeof CONFIG !== 'undefined' ? CONFIG.deliveryTime : '15–25 Days';
  const readyStockDelivery = (typeof CONFIG !== 'undefined' && CONFIG.readyStockDeliveryTime) || '২–৩ Days';

  grid.innerHTML = filtered.map(p => {
    const inStock = isProductInStock(p);
    const regularPrice = Number(p.regular_price) || 0;
    const currentPrice = Number(p.price) || 0;
    const discount = regularPrice > currentPrice
      ? Math.round(((regularPrice - currentPrice) / regularPrice) * 100)
      : 0;
    const saveAmount = regularPrice > currentPrice ? (regularPrice - currentPrice) : 0;

    const hasVariants = (p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0);
    const optimizedImg = getOptimizedImageUrl(p.image, 500);

    return `
    <div class="product-card" onclick="window.location='product.html?id=${p.id}'" style="cursor:pointer">
      <div class="prod-img-wrap">
        ${inStock 
          ? `<span class="badge-instock"><span class="pulse-dot green"></span>🟢 Ready Stock • ${readyStockDelivery}</span>`
          : `<span class="badge-preorder">✈️ Global Pre-Order • ${deliveryTime}</span>`
        }
        ${discount > 0 ? `<span class="badge-discount">-${discount}% OFF</span>` : ''}
        <img src="${optimizedImg}" alt="${escapeHtml(p.name)}" loading="lazy" referrerpolicy="no-referrer" class="prod-img" onerror="this.onerror=null;this.src='images/hero_banner.jpg';">
      </div>
      <div class="prod-body">
        <div class="prod-cat">${escapeHtml(p.category)}</div>
        <h3 class="prod-title">${escapeHtml(p.name)}</h3>
        <div class="prod-price-row">
          <span class="price-current">${currency}${currentPrice.toLocaleString()}</span>
          ${regularPrice ? `<span class="price-old">${currency}${regularPrice.toLocaleString()}</span>` : ''}
          ${saveAmount > 0 ? `<span style="font-size:11px;color:#10b981;font-weight:700">Save ${currency}${saveAmount}</span>` : ''}
        </div>
        <div class="prod-actions" onclick="event.stopPropagation()">
          ${hasVariants ? `
            <button class="btn-card-cart" onclick="window.location='product.html?id=${p.id}'">
              🎨 Options
            </button>
            <button class="btn-card-buy" onclick="window.location='product.html?id=${p.id}'">
              ⚡ Order Now
            </button>
          ` : `
            <button class="btn-card-cart" onclick="addToCart(${p.id}, 1, true)">
              🛒 Add to Bag
            </button>
            <button class="btn-card-buy" onclick="openDirectCheckout(${p.id})">
              ⚡ Order Now
            </button>
          `}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ---- Cart Management with Variant Support ----
function getCartItemKey(id, size, color) {
  return `${id}__${size || ''}__${color || ''}`;
}

function loadCart() {
  try {
    const raw = localStorage.getItem('zayn_cart');
    if (!raw) {
      cart = [];
    } else if (raw.startsWith('[') || raw.startsWith('{')) {
      cart = JSON.parse(raw);
    } else {
      try {
        cart = JSON.parse(decodeURIComponent(escape(atob(raw))));
      } catch (_) {
        cart = JSON.parse(atob(raw));
      }
    }
    if (!Array.isArray(cart)) cart = [];

    // Ensure all items have a variantKey for unique tracking
    cart.forEach(item => {
      if (!item.variantKey) {
        item.variantKey = getCartItemKey(item.id, item.size, item.color);
      }
    });
  } catch (e) {
    console.warn('Could not parse cart from localStorage:', e);
    cart = [];
  }
  updateCartBadge();
  renderCartItems();
  if (typeof renderCheckoutItems === 'function') {
    renderCheckoutItems();
  }
  checkAbandonedCart();
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
  checkAbandonedCart();
}

// Immediately load cart into memory
loadCart();

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('.cart-badge-count, .mob-nav-badge').forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
  });
}

function addToCart(productId, qty = 1, openDrawer = true, selectedSize = '', selectedColor = '') {
  const product = allProducts.find(p => String(p.id).trim() === String(productId).trim());
  if (!product) return;

  const vKey = getCartItemKey(product.id, selectedSize, selectedColor);
  const existingIndex = cart.findIndex(item => (item.variantKey || item.id) === vKey);

  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({
      id: product.id,
      variantKey: vKey,
      name: product.name,
      price: product.price,
      regular_price: product.regular_price || product.price,
      image: product.image,
      category: product.category,
      badge: product.badge,
      stock_status: product.stock_status,
      size: selectedSize,
      color: selectedColor,
      qty: qty
    });
  }

  saveCart();

  trackEvent('AddToCart', {
    content_name: product.name,
    content_ids: [String(product.id)],
    content_type: 'product',
    value: product.price * qty,
    currency: 'BDT'
  });

  const variantDesc = [selectedSize ? 'Size: ' + selectedSize : '', selectedColor ? 'Color: ' + selectedColor : ''].filter(Boolean).join(', ');
  showToast(`🛒 ${product.name}${variantDesc ? ' (' + variantDesc + ')' : ''} added to your bag!`);

  if (openDrawer) {
    openCartDrawer();
  }
}

function openDirectCheckout(productId, qty = 1, selectedSize = '', selectedColor = '') {
  addToCart(productId, qty, false, selectedSize, selectedColor);
  window.location.href = 'order.html';
}

function updateCartItemQty(key, delta) {
  const itemIndex = cart.findIndex(item => (item.variantKey || item.id) === key);
  if (itemIndex === -1) return;

  cart[itemIndex].qty += delta;

  if (cart[itemIndex].qty <= 0) {
    cart.splice(itemIndex, 1);
    showToast('Item removed from bag');
  }

  saveCart();
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  renderCartItems();
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

  list.innerHTML = cart.map(item => {
    const key = item.variantKey || item.id;
    const variantTag = (item.size || item.color)
      ? `<div style="font-size:11px;color:#2563eb;font-weight:700;margin-top:2px">${[item.size ? 'Size: ' + item.size : '', item.color ? 'Color: ' + item.color : ''].filter(Boolean).join(' | ')}</div>`
      : '';
    const optimizedThumb = getOptimizedImageUrl(item.image, 160);

    return `
    <div class="cart-item">
      <img src="${optimizedThumb}" alt="${escapeHtml(item.name)}" class="cart-item-img" loading="lazy" onerror="this.onerror=null;this.src='images/hero_banner.jpg';">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        ${variantTag}
        <div class="cart-item-price">${currency}${item.price.toLocaleString()} × ${item.qty}</div>
        <div class="qty-control">
          <button type="button" onclick="updateCartItemQty('${key}', -1)">−</button>
          <span>${item.qty}</span>
          <button type="button" onclick="updateCartItemQty('${key}', 1)">+</button>
        </div>
      </div>
      <button type="button" class="cart-item-del" onclick="updateCartItemQty('${key}', -9999)" title="Remove item">✕</button>
    </div>`;
  }).join('');

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

// ---- Phase 3: Abandoned Cart Floating Bar ----
function checkAbandonedCart() {
  const isOrderPage = window.location.pathname.includes('order.html');
  if (isOrderPage) {
    const existing = document.getElementById('abandonedCartBar');
    if (existing) existing.remove();
    return;
  }

  const dismissed = sessionStorage.getItem('zayn_dismissed_abandoned_cart');
  if (dismissed === '1') return;

  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  let bar = document.getElementById('abandonedCartBar');

  if (totalQty > 0) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'abandonedCartBar';
      bar.className = 'abandoned-cart-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;">
        <span>🛍️</span>
        <span>আপনার ব্যাগে ${totalQty} টি প্রোডাক্ট অপেক্ষা করছে!</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <a href="order.html" class="btn-abandoned-checkout">চেকআউট ⚡</a>
        <button type="button" class="btn-abandoned-close" onclick="dismissAbandonedCart()" title="Dismiss">✕</button>
      </div>
    `;
  } else if (bar) {
    bar.remove();
  }
}

function dismissAbandonedCart() {
  sessionStorage.setItem('zayn_dismissed_abandoned_cart', '1');
  const bar = document.getElementById('abandonedCartBar');
  if (bar) bar.remove();
}
window.dismissAbandonedCart = dismissAbandonedCart;

// ---- Modern Mobile Bottom Navigation Bar ----
function renderMobileBottomNav() {
  if (document.getElementById('mobileBottomNav')) return;

  const path = window.location.pathname;
  const isHome = path.endsWith('index.html') || path.endsWith('/') || !path.includes('.html');
  const isTrack = path.includes('track.html');

  const nav = document.createElement('nav');
  nav.id = 'mobileBottomNav';
  nav.className = 'mobile-bottom-nav';

  const waNumber = (typeof CONFIG !== 'undefined' && CONFIG.whatsappNumber) || '8801860034712';

  nav.innerHTML = `
    <a href="index.html" class="mob-nav-item ${isHome ? 'active' : ''}">
      <span class="mob-nav-icon">🏠</span>
      <span class="mob-nav-label">হোম</span>
    </a>
    <a href="index.html#categoryPills" class="mob-nav-item" onclick="if(window.location.pathname.includes('index.html')){setCategory('all');document.getElementById('categoryPills')?.scrollIntoView({behavior:'smooth'});return false;}">
      <span class="mob-nav-icon">🏷️</span>
      <span class="mob-nav-label">ক্যাটাগরি</span>
    </a>
    <a href="javascript:void(0)" class="mob-nav-item" onclick="openCartDrawer()">
      <span class="mob-nav-icon">🛍️</span>
      <span class="mob-nav-label">ব্যাগ</span>
      <span class="mob-nav-badge" style="display:none">0</span>
    </a>
    <a href="track.html" class="mob-nav-item ${isTrack ? 'active' : ''}">
      <span class="mob-nav-icon">📦</span>
      <span class="mob-nav-label">ট্র্যাক</span>
    </a>
    <a href="https://wa.me/${waNumber}" target="_blank" class="mob-nav-item">
      <span class="mob-nav-icon">💬</span>
      <span class="mob-nav-label">WhatsApp</span>
    </a>
  `;

  document.body.appendChild(nav);
  updateCartBadge();
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
  renderMobileBottomNav();

  // Enable horizontal mouse wheel scroll on category nav & pills
  const enableHorizontalWheel = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  };
  enableHorizontalWheel('categoryNavInner');
  enableHorizontalWheel('categoryPills');


  // Load products if on index or page with productGrid
  if (document.getElementById('productGrid')) {
    loadProducts();
  }

  // Live search filtering
  document.getElementById('searchQuery')?.addEventListener('input', () => {
    renderProducts();
  });
});
