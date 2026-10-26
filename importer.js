/**
 * Zayn Shop BD — 1-Click MoveDrop Importer Extension Script
 * Runs inside MoveDrop (movedrop.global) or any supplier page (1688, AliExpress)
 */
(function() {
  // Prevent duplicate modals
  const existing = document.getElementById('zayn-shop-importer-modal');
  if (existing) {
    existing.remove();
  }

  // --- 1. INTELLIGENT DATA EXTRACTION ---
  
  // Extract Title
  let title = '';
  // Check input/textarea on MoveDrop Product tab
  const titleInput = document.querySelector('textarea, input[placeholder*="title" i], input[placeholder*="Title" i], .title-input');
  if (titleInput && titleInput.value && titleInput.value.trim().length > 5) {
    title = titleInput.value.trim();
  }
  // Check headings
  if (!title) {
    const hEl = document.querySelector('h1, h2, .product-title, .title, [class*="product_title"]');
    if (hEl && hEl.innerText && hEl.innerText.trim().length > 5) {
      title = hEl.innerText.trim();
    }
  }
  // Check document title
  if (!title) {
    title = (document.title || '').replace(/[-|].*$/, '').trim();
  }

  // Extract Images
  const allImgs = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(src => {
    if (!src || !src.startsWith('http')) return false;
    const s = src.toLowerCase();
    if (s.includes('avatar') || s.includes('logo') || s.includes('icon') || s.includes('badge') || s.includes('.svg')) return false;
    return s.includes('alicdn') || s.includes('1688') || s.includes('cib') || s.includes('storage') || s.includes('.jpg') || s.includes('.png') || s.includes('.webp') || s.includes('.jpeg');
  });
  // Unique images
  const uniqueImgs = [...new Set(allImgs)];
  let selectedImg = uniqueImgs[0] || 'https://photopixc-spec.github.io/preorder-zaynshop/images/hero_banner.jpg';

  // Extract Prices (BDT)
  let detectedSalePrice = '';
  let detectedRegPrice = '';

  // Look for inputs where user entered prices (e.g. 1111, 2222)
  const numberInputs = Array.from(document.querySelectorAll('input')).map(inp => inp.value.replace(/[^0-9]/g, '')).filter(v => {
    const n = parseInt(v, 10);
    return n >= 100 && n <= 100000;
  });

  if (numberInputs.length >= 2) {
    const num1 = parseInt(numberInputs[0], 10);
    const num2 = parseInt(numberInputs[1], 10);
    detectedSalePrice = Math.min(num1, num2);
    detectedRegPrice = Math.max(num1, num2);
  } else if (numberInputs.length === 1) {
    detectedSalePrice = numberInputs[0];
    detectedRegPrice = Math.round(Number(numberInputs[0]) * 1.25);
  } else {
    // Check page text for ৳ price
    const bdtMatch = document.body.innerText.match(/৳\s*([0-9,]+)/) || document.body.innerText.match(/([0-9,]+)\s*BDT/);
    if (bdtMatch) {
      detectedSalePrice = bdtMatch[1].replace(/,/g, '');
      detectedRegPrice = Math.round(Number(detectedSalePrice) * 1.25);
    } else {
      detectedSalePrice = '1111';
      detectedRegPrice = '2222';
    }
  }

  // Smart Category Guess
  const tLower = title.toLowerCase();
  let guessedCategory = 'Jewelry & Accessories';
  if (tLower.includes('serum') || tLower.includes('zinc') || tLower.includes('niacinamide') || tLower.includes('cream') || tLower.includes('skin') || tLower.includes('oil') || tLower.includes('beauty') || tLower.includes('cosmetic')) {
    guessedCategory = 'Beauty & Skincare';
  } else if (tLower.includes('necklace') || tLower.includes('ring') || tLower.includes('earring') || tLower.includes('bracelet') || tLower.includes('keychain') || tLower.includes('jewelry') || tLower.includes('zircon')) {
    guessedCategory = 'Jewelry & Accessories';
  } else if (tLower.includes('toy') || tLower.includes('plush') || tLower.includes('doll') || tLower.includes('game') || tLower.includes('puzzle') || tLower.includes('painting')) {
    guessedCategory = 'Cute & Toys';
  } else if (tLower.includes('cup') || tLower.includes('bottle') || tLower.includes('lamp') || tLower.includes('box') || tLower.includes('organizer') || tLower.includes('decor') || tLower.includes('home')) {
    guessedCategory = 'Home & Living';
  } else if (tLower.includes('bag') || tLower.includes('dress') || tLower.includes('shirt') || tLower.includes('pant') || tLower.includes('hair') || tLower.includes('wear') || tLower.includes('shoe')) {
    guessedCategory = 'Fashion & Wear';
  }

  // Extract Description / Specs
  let descText = '';
  const specEl = document.querySelector('.ck-content, [contenteditable="true"], .specification, .description');
  if (specEl && specEl.innerText && specEl.innerText.length > 20) {
    descText = specEl.innerText.slice(0, 300);
  } else {
    descText = 'Imported on pre-order from MoveDrop / global suppliers. Delivery 15-25 days across Bangladesh.';
  }

  // --- 2. CREATE FLOATING MODAL OVER MOVEDROP ---
  const modal = document.createElement('div');
  modal.id = 'zayn-shop-importer-modal';
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 420px;
    max-width: 90vw;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08);
    z-index: 9999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    overflow: hidden;
    animation: zaynSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // Inject CSS Keyframe
  if (!document.getElementById('zayn-importer-styles')) {
    const style = document.createElement('style');
    style.id = 'zayn-importer-styles';
    style.textContent = `
      @keyframes zaynSlideIn {
        from { opacity: 0; transform: translateY(-20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .zayn-inp {
        width: 100%;
        padding: 9px 12px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .zayn-inp:focus { border-color: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,0.15); }
      .zayn-thumb-strip {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 6px;
        margin-top: 6px;
      }
      .zayn-thumb-img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid transparent;
      }
      .zayn-thumb-img.selected {
        border-color: #f43f5e;
      }
    `;
    document.head.appendChild(style);
  }

  // Thumbnails HTML
  const thumbHtml = uniqueImgs.slice(0, 7).map((src, idx) => `
    <img src="${src}" class="zayn-thumb-img ${idx === 0 ? 'selected' : ''}" onclick="
      document.getElementById('zayn-preview-img').src = '${src}';
      document.getElementById('zayn-img-url').value = '${src}';
      document.querySelectorAll('.zayn-thumb-img').forEach(el => el.classList.remove('selected'));
      this.classList.add('selected');
    ">
  `).join('');

  modal.innerHTML = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); color: #ffffff; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⚡</span>
        <div>
          <div style="font-size: 14px; font-weight: 800; letter-spacing: -0.2px;">Zayn Shop Importer</div>
          <div style="font-size: 11px; opacity: 0.75;">1-Click MoveDrop Sync</div>
        </div>
      </div>
      <button type="button" onclick="document.getElementById('zayn-shop-importer-modal').remove()" style="background: none; border: none; color: #ffffff; font-size: 20px; cursor: pointer; opacity: 0.8; line-height: 1;">✕</button>
    </div>

    <!-- Body -->
    <div style="padding: 16px; max-height: 75vh; overflow-y: auto;">
      
      <!-- Main Image Preview + Thumbnails -->
      <div style="display: flex; gap: 12px; margin-bottom: 14px;">
        <img id="zayn-preview-img" src="${selectedImg}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0;">
        <div style="flex: 1; min-width: 0;">
          <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product Image</label>
          <div class="zayn-thumb-strip">
            ${thumbHtml || '<span style="font-size:11px;color:#94a3b8">Image selected</span>'}
          </div>
          <input type="hidden" id="zayn-img-url" value="${selectedImg}">
        </div>
      </div>

      <!-- Title -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Product Title *</label>
        <textarea id="zayn-title" class="zayn-inp" rows="2" style="resize: vertical;">${title}</textarea>
      </div>

      <!-- Pricing Row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #059669; margin-bottom: 4px;">Sale Price (৳) *</label>
          <input type="number" id="zayn-price" class="zayn-inp" value="${detectedSalePrice}" placeholder="1111" style="font-weight: 800; color: #059669;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;">Regular Price (৳)</label>
          <input type="number" id="zayn-reg-price" class="zayn-inp" value="${detectedRegPrice}" placeholder="2222">
        </div>
      </div>

      <!-- Category -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Category *</label>
        <select id="zayn-category" class="zayn-inp">
          <option value="Beauty & Skincare" ${guessedCategory === 'Beauty & Skincare' ? 'selected' : ''}>💄 Beauty & Skincare</option>
          <option value="Jewelry & Accessories" ${guessedCategory === 'Jewelry & Accessories' ? 'selected' : ''}>💎 Jewelry & Accessories</option>
          <option value="Cute & Toys" ${guessedCategory === 'Cute & Toys' ? 'selected' : ''}>🧸 Cute & Toys</option>
          <option value="Home & Living" ${guessedCategory === 'Home & Living' ? 'selected' : ''}>🏡 Home & Living</option>
          <option value="Fashion & Wear" ${guessedCategory === 'Fashion & Wear' ? 'selected' : ''}>👗 Fashion & Wear</option>
        </select>
      </div>

      <!-- Description -->
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Description / Specs</label>
        <textarea id="zayn-desc" class="zayn-inp" rows="2" style="font-size: 11px; resize: vertical;">${descText}</textarea>
      </div>

      <!-- Submit Button -->
      <button type="button" id="zayn-submit-btn" style="
        width: 100%;
        background: linear-gradient(135deg, #e11d48, #f43f5e);
        color: #ffffff;
        border: none;
        padding: 12px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(225,29,72,0.35);
        transition: transform 0.15s, opacity 0.15s;
      ">
        <span>🚀</span>
        <span id="zayn-btn-text">Import to Zayn Shop Store</span>
      </button>

      <div id="zayn-status-msg" style="margin-top: 10px; text-align: center; font-size: 12px; display: none;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // --- 3. SUBMIT ACTION ---
  document.getElementById('zayn-submit-btn').addEventListener('click', async function() {
    const btn = document.getElementById('zayn-submit-btn');
    const btnText = document.getElementById('zayn-btn-text');
    const statusMsg = document.getElementById('zayn-status-msg');

    const nameVal = document.getElementById('zayn-title').value.trim();
    const priceVal = parseInt(document.getElementById('zayn-price').value, 10);
    const regPriceVal = parseInt(document.getElementById('zayn-reg-price').value, 10) || Math.round(priceVal * 1.25);
    const catVal = document.getElementById('zayn-category').value;
    const imgVal = document.getElementById('zayn-img-url').value.trim();
    const descVal = document.getElementById('zayn-desc').value.trim();

    if (!nameVal) {
      alert('Product title cannot be empty.');
      return;
    }
    if (!priceVal || isNaN(priceVal)) {
      alert('Please enter a valid selling price.');
      return;
    }

    btn.disabled = true;
    btn.style.opacity = '0.75';
    btnText.textContent = '⏳ Importing to Store…';

    const payload = {
      action: 'add_product',
      id: Math.floor(1000 + Math.random() * 9000),
      name: nameVal,
      category: catVal,
      price: priceVal,
      regular_price: regPriceVal,
      image: imgVal,
      description: descVal,
      badge: 'Pre-Order',
      status: 'Active'
    };

    const webhookUrl = 'https://script.google.com/macros/s/AKfycbz6_ZkMemBMd8kUDicKdQtaB-kdNgDonPSTEC1-W6ilwEji7MLcgFzXShKqAKsYxkuv1A/exec';

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      statusMsg.style.display = 'block';
      statusMsg.style.color = '#059669';
      statusMsg.innerHTML = '🎉 <b>Successfully Imported to Zayn Shop!</b><br><span style="font-size:11px;color:#64748b">Product is now live on your website and Google Sheet!</span>';
      
      btn.style.background = '#059669';
      btnText.textContent = '✅ Imported Successfully!';

      setTimeout(() => {
        modal.style.animation = 'none';
        modal.style.transition = 'opacity 0.4s, transform 0.4s';
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(-20px)';
        setTimeout(() => modal.remove(), 400);
      }, 2500);

    } catch (err) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btnText.textContent = '🚀 Try Again';
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#e11d48';
      statusMsg.textContent = 'Error importing: ' + err.message;
    }
  });

})();
