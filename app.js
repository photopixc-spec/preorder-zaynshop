// Zayn Shop BD — Pre-Order E-Commerce Engine
// High-Converting, Lightweight, Zero-Hosting Architecture

let allProducts = [];
let cart = [];
let activeCategory = 'all';
let currentProduct = null;
let deliveryArea = 'dhaka'; // 'dhaka' or 'outside'

// ---- Tracking Initialization (Meta Pixel & GTM) ----
function initTracking() {
  window.dataLayer = window.dataLayer || [];

  // 1. Meta Pixel
  if (CONFIG.metaPixelId) {
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
  if (CONFIG.gtmId) {
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
  // Console logging for verification with Marketing Inspector AI
  console.log(`[Tracking Event] ${name}:`, params);

  // Meta Pixel
  if (window.fbq) {
    fbq('track', name, params);
  }

  // GTM / dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

// ---- Load Products & Render ----
async function loadProducts() {
  try {
    const res = await fetch('products.json');
    allProducts = await res.json();
    renderProducts();
    renderCategoryPills();
  } catch (err) {
    console.error('Failed to load products:', err);
    document.getElementById('productGrid').innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444">প্রোডাক্ট লোড করতে সমস্যা হয়েছে।</p>';
  }
}

function renderCategoryPills() {
  const categories = ['all', ...new Set(allProducts.map(p => p.category))];
  const container = document.getElementById('categoryPills');
  if (!container) return;

  container.innerHTML = categories.map(cat => `
    <button class="cat-pill ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
      ${cat === 'all' ? '✨ সকল পণ্য (' + allProducts.length + ')' : cat}
    </button>
  `).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  renderCategoryPills();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchQuery')?.value.toLowerCase().trim() || '';

  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !searchInput || p.name.toLowerCase().includes(searchInput) || p.description.toLowerCase().includes(searchInput);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#64748b"><h3>কোনো প্রোডাক্ট মেলেনি!</h3><p>অনুসন্ধানের শব্দ পরিবর্তন করে চেষ্টা করুন।</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const discount = p.regular_price && p.regular_price > p.price 
      ? Math.round(((p.regular_price - p.price) / p.regular_price) * 100) 
      : 0;

    return `
    <div class="product-card" onclick="openProductModal(${p.id})">
      <div class="prod-img-wrap">
        <span class="badge-preorder">Pre-Order (${CONFIG.deliveryTime})</span>
        ${discount > 0 ? `<span class="badge-discount">${discount}% ছাড়</span>` : ''}
        <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" class="prod-img">
      </div>
      <div class="prod-body">
        <div class="prod-cat">${p.category}</div>
        <h3 class="prod-title">${escapeHtml(p.name)}</h3>
        <div class="prod-price-row">
          <span class="price-current">${CONFIG.currencySymbol}${p.price.toLocaleString()}</span>
          ${p.regular_price ? `<span class="price-old">${CONFIG.currencySymbol}${p.regular_price.toLocaleString()}</span>` : ''}
        </div>
        <div class="prod-actions" onclick="event.stopPropagation()">
          <button class="btn-card-cart" onclick="addToCart(${p.id})">
            🛒 ব্যাগে রাখুন
          </button>
          <button class="btn-card-buy" onclick="openDirectCheckout(${p.id})">
            ⚡ অর্ডার করুন
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ---- Product Modal (Quick View) ----
function openProductModal(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;
  currentProduct = p;

  // Track ViewContent
  trackEvent('ViewContent', {
    content_name: p.name,
    content_ids: [String(p.id)],
    content_type: 'product',
    value: p.price,
    currency: 'BDT'
  });

  document.getElementById('modalImg').src = p.image;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalCat').textContent = p.category;
  document.getElementById('modalPrice').textContent = `${CONFIG.currencySymbol}${p.price.toLocaleString()}`;
  document.getElementById('modalOldPrice').textContent = p.regular_price ? `${CONFIG.currencySymbol}${p.regular_price.toLocaleString()}` : '';
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalQty').value = 1;

  document.getElementById('productModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  currentProduct = null;
}

function updateModalQty(delta) {
  const qtyEl = document.getElementById('modalQty');
  let q = parseInt(qtyEl.value) + delta;
  if (q < 1) q = 1;
  qtyEl.value = q;
}

function addModalToCart() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('modalQty').value) || 1;
  addToCart(currentProduct.id, qty);
  closeProductModal();
  openCartDrawer();
}

function buyModalNow() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('modalQty').value) || 1;
  openDirectCheckout(currentProduct.id, qty);
  closeProductModal();
}

// ---- Cart Management ----
function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('zayn_cart') || '[]');
  } catch (e) {
    cart = [];
  }
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem('zayn_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartItems();
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge-count').forEach(el => {
    el.textContent = totalCount;
    el.style.display = totalCount > 0 ? 'inline-flex' : 'none';
  });
}

function addToCart(productId, qty = 1) {
  const p = allProducts.find(item => item.id === productId);
  if (!p) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
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

  showToast(`✅ "${p.name}" ব্যাগে যোগ করা হয়েছে!`);
}

function updateCartItemQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
}

function openCartDrawer() {
  renderCartItems();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = 'auto';
}

function setDeliveryArea(area) {
  deliveryArea = area;
  renderCartItems();
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  if (!list) return;

  if (!cart.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:#94a3b8">
        <div style="font-size:48px;margin-bottom:12px">🛒</div>
        <h4>আপনার ব্যাগ খালি!</h4>
        <p style="font-size:13px;margin-top:6px">পছন্দের পণ্যটি ব্যাগে যোগ করুন।</p>
      </div>`;
    document.getElementById('cartFooter').style.display = 'none';
    return;
  }

  document.getElementById('cartFooter').style.display = 'block';

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <div class="cart-item-price">${CONFIG.currencySymbol}${item.price.toLocaleString()} × ${item.qty}</div>
        <div class="qty-control">
          <button onclick="updateCartItemQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartItemQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="updateCartItemQty(${item.id}, -9999)" title="মুছে ফেলুন">✕</button>
    </div>
  `).join('');

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = deliveryArea === 'dhaka' ? CONFIG.deliveryDhaka : CONFIG.deliveryOutside;
  const total = subtotal + delivery;

  document.getElementById('cartSubtotal').textContent = `${CONFIG.currencySymbol}${subtotal.toLocaleString()}`;
  document.getElementById('cartDelivery').textContent = `${CONFIG.currencySymbol}${delivery}`;
  document.getElementById('cartTotal').textContent = `${CONFIG.currencySymbol}${total.toLocaleString()}`;
}

// ---- Checkout Modal & Order Placement ----
let checkoutItems = [];

function openDirectCheckout(productId, qty = 1) {
  const p = allProducts.find(item => item.id === productId);
  if (!p) return;
  checkoutItems = [{
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    qty: qty
  }];
  showCheckoutModal();
}

function openCartCheckout() {
  if (!cart.length) return;
  checkoutItems = [...cart];
  closeCartDrawer();
  showCheckoutModal();
}

function showCheckoutModal() {
  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = deliveryArea === 'dhaka' ? CONFIG.deliveryDhaka : CONFIG.deliveryOutside;
  const total = subtotal + delivery;

  // Track InitiateCheckout
  trackEvent('InitiateCheckout', {
    num_items: checkoutItems.length,
    value: total,
    currency: 'BDT'
  });

  // Render Order Summary in modal
  document.getElementById('coItemsList').innerHTML = checkoutItems.map(item => `
    <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px dashed #e2e8f0">
      <span>${escapeHtml(item.name)} × ${item.qty}</span>
      <b>${CONFIG.currencySymbol}${(item.price * item.qty).toLocaleString()}</b>
    </div>
  `).join('');

  document.getElementById('coTotal').textContent = `${CONFIG.currencySymbol}${total.toLocaleString()}`;
  document.getElementById('coAdvance').textContent = `${CONFIG.currencySymbol}${CONFIG.advanceAmount}`;

  document.getElementById('checkoutModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('coName').value.trim();
  const phone = document.getElementById('coPhone').value.trim();
  const address = document.getElementById('coAddress').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';
  const note = document.getElementById('coNote').value.trim();

  if (!name || !phone || !address) {
    alert('দয়া করে নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা দিন!');
    return;
  }

  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = deliveryArea === 'dhaka' ? CONFIG.deliveryDhaka : CONFIG.deliveryOutside;
  const total = subtotal + delivery;
  const orderId = 'ZS-' + Math.floor(100000 + Math.random() * 900000);

  // Track Purchase Event!
  trackEvent('Purchase', {
    content_name: 'Pre-Order Purchase',
    content_ids: checkoutItems.map(i => String(i.id)),
    content_type: 'product',
    value: total,
    currency: 'BDT',
    num_items: checkoutItems.length
  });

  // Build WhatsApp Message
  let itemsText = checkoutItems.map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${item.qty}) — ${CONFIG.currencySymbol}${(item.price * item.qty).toLocaleString()}`).join('\n');

  const waMsg = 
    `🛍️ *New Pre-Order from Zayn Shop*\n` +
    `──────────────────────────\n` +
    `📦 *Order ID:* #${orderId}\n` +
    `👤 *Customer Name:* ${name}\n` +
    `📞 *Mobile Phone:* ${phone}\n` +
    `📍 *Full Address:* ${address}\n` +
    `🚚 *Delivery Area:* ${deliveryArea === 'dhaka' ? 'Inside Dhaka (৳70)' : 'Outside Dhaka (৳130)'}\n` +
    `💳 *Payment Choice:* ${paymentMethod}\n` +
    (note ? `📝 *Customer Note:* ${note}\n` : '') +
    `──────────────────────────\n` +
    `📋 *Ordered Products:*\n${itemsText}\n` +
    `──────────────────────────\n` +
    `💰 *Subtotal:* ${CONFIG.currencySymbol}${subtotal.toLocaleString()}\n` +
    `🚚 *Delivery Charge:* ${CONFIG.currencySymbol}${delivery}\n` +
    `💵 *Total Payable:* ${CONFIG.currencySymbol}${total.toLocaleString()}\n` +
    `⚠️ *Pre-order Advance:* ${CONFIG.currencySymbol}${CONFIG.advanceAmount} (পেমেন্ট করে স্ক্রিনশট পাঠাবেন)\n` +
    `──────────────────────────\n` +
    `ধন্যবাদ! আমি অর্ডারটি কনফার্ম করতে চাই।`;

  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;

  // Clear cart if items were from cart
  cart = [];
  saveCart();
  closeCheckoutModal();

  // Show Thank You Screen
  showThankYouScreen(orderId, total, waUrl);
}

function showThankYouScreen(orderId, total, waUrl) {
  document.getElementById('tyOrderId').textContent = `#${orderId}`;
  document.getElementById('tyTotal').textContent = `${CONFIG.currencySymbol}${total.toLocaleString()}`;
  document.getElementById('tyWaBtn').href = waUrl;

  document.getElementById('thankYouModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Automatically open WhatsApp in new tab after 1.5s
  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 1200);
}

function closeThankYouModal() {
  document.getElementById('thankYouModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Utility Helpers ----
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ---- Init on DOM Ready ----
window.addEventListener('DOMContentLoaded', () => {
  initTracking();
  loadCart();
  loadProducts();

  // Search input live filter
  document.getElementById('searchQuery')?.addEventListener('input', () => {
    renderProducts();
  });
});
