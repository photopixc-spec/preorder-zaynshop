/**
 * Zayn Shop BD — 1-Click MoveDrop Importer Extension Script
 * Runs inside MoveDrop (movedrop.global) or supplier pages
 */
(function() {
  // Prevent duplicate modals
  const existing = document.getElementById('zayn-shop-importer-modal');
  if (existing) {
    existing.remove();
  }

  // --- 1. INTELLIGENT DATA EXTRACTION HELPERS ---

  // Clean description text and strip supplier export noise
  function cleanDescriptionText(raw) {
    if (!raw) return '';
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const cleaned = lines.filter(l => {
      const low = l.toLowerCase();
      if (low.startsWith('• main downstream platforms') || low.startsWith('main downstream platforms')) return false;
      if (low.startsWith('• main sales regions') || low.startsWith('main sales regions')) return false;
      if (low.includes('cross-border export') || low.includes('licansable private label')) return false;
      if (low.startsWith('update product description') || low.startsWith('generate description with ai')) return false;
      return true;
    });
    return cleaned.join('\n');
  }

  // Find rich-text editor or specifications container in current DOM
  function findEditorText() {
    const selectors = [
      '.ql-editor',
      '.w-e-text',
      '.ck-content',
      '.ProseMirror',
      '[contenteditable="true"]',
      '.tox-edit-area__iframe',
      '.description-editor',
      '[class*="editor"] [contenteditable="true"]',
      'div[placeholder*="description" i]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text && text.length > 15) {
          return cleanDescriptionText(text);
        }
      }
    }
    // Check if there is any element containing "Specification:"
    const allDivs = Array.from(document.querySelectorAll('div, p, section'));
    const specContainer = allDivs.find(d => {
      const t = d.innerText || '';
      return (t.includes('Specification:') || t.includes('Specifications:')) && t.length > 25 && t.length < 5000;
    });
    if (specContainer) {
      return cleanDescriptionText(specContainer.innerText);
    }
    return '';
  }

  // Extract Title
  let title = '';
  const titleInput = document.querySelector('textarea, input[placeholder*="title" i], input[placeholder*="Title" i], .title-input');
  if (titleInput && titleInput.value && titleInput.value.trim().length > 5) {
    title = titleInput.value.trim();
  }
  if (!title) {
    const hEl = document.querySelector('h1, h2, .product-title, .title, [class*="product_title"]');
    if (hEl && hEl.innerText && hEl.innerText.trim().length > 5) {
      title = hEl.innerText.trim();
    }
  }
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
  const uniqueImgs = [...new Set(allImgs)];
  let selectedImg = uniqueImgs[0] || 'https://photopixc-spec.github.io/preorder-zaynshop/images/hero_banner.jpg';

  // Extract Prices (BDT)
  let detectedSalePrice = '';
  let detectedRegPrice = '';

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
    const bdtMatch = document.body.innerText.match(/৳\s*([0-9,]+)/) || document.body.innerText.match(/([0-9,]+)\s*BDT/);
    if (bdtMatch) {
      detectedSalePrice = bdtMatch[1].replace(/,/g, '');
      detectedRegPrice = Math.round(Number(detectedSalePrice) * 1.25);
    } else {
      detectedSalePrice = '1111';
      detectedRegPrice = '2222';
    }
  }

  // Extract Initial Description / Specs
  let descText = findEditorText();
  if (!descText) {
    descText = 'Imported on pre-order from MoveDrop / global suppliers. 100% money back / replacement guarantee. Delivery 15-25 days across Bangladesh.';
  }

  // Smart Category Guess across all 10 authentic store categories
  const tLower = (title + ' ' + descText).toLowerCase();
  let guessedCategory = 'Home & Living';
  if (tLower.includes('serum') || tLower.includes('zinc') || tLower.includes('niacinamide') || tLower.includes('cream') || tLower.includes('skin') || tLower.includes('beauty') || tLower.includes('cosmetic') || tLower.includes('lotion') || tLower.includes('toner') || tLower.includes('cleanser')) {
    guessedCategory = 'Beauty & Skincare';
  } else if (tLower.includes('pet') || tLower.includes('cat') || tLower.includes('dog') || tLower.includes('fountain') || tLower.includes('litter') || tLower.includes('leash') || tLower.includes('collar')) {
    guessedCategory = 'Pet Supplies';
  } else if (tLower.includes('hand warmer') || tLower.includes('hand-warmer') || tLower.includes('winter') || tLower.includes('warmer') || tLower.includes('jacket') || tLower.includes('glove') || tLower.includes('scarf') || tLower.includes('heater') || tLower.includes('fleece') || tLower.includes('thermal')) {
    guessedCategory = 'Winter Collection';
  } else if (tLower.includes('diamond painting') || tLower.includes('painting kit') || tLower.includes('needle felting') || tLower.includes('wool felting') || tLower.includes('diy') || tLower.includes('craft') || tLower.includes('bead') || tLower.includes('sticker') || tLower.includes('label') || tLower.includes('embroidery') || tLower.includes('shrink film')) {
    guessedCategory = 'DIY & Crafts';
  } else if (tLower.includes('bag') || tLower.includes('pouch') || tLower.includes('pencil case') || tLower.includes('backpack') || tLower.includes('purse') || tLower.includes('tote') || tLower.includes('wallet')) {
    guessedCategory = 'Bags & Pouches';
  } else if (tLower.includes('stationery') || tLower.includes('journal') || tLower.includes('notebook') || tLower.includes('book') || tLower.includes('ruler')) {
    guessedCategory = 'Stationery & Books';
  } else if (tLower.includes('toy') || tLower.includes('plush') || tLower.includes('doll') || tLower.includes('puzzle') || tLower.includes('sand set') || tLower.includes('kids') || tLower.includes('baby') || tLower.includes('fidget')) {
    guessedCategory = 'Kids & Toys';
  } else if (tLower.includes('necklace') || tLower.includes('ring') || tLower.includes('earring') || tLower.includes('bracelet') || tLower.includes('jewelry') || tLower.includes('zircon') || tLower.includes('pendant') || tLower.includes('brooch') || tLower.includes('hair clip') || tLower.includes('keychain')) {
    guessedCategory = 'Jewelry & Accessories';
  } else if (tLower.includes('gift') || tLower.includes('birthday') || tLower.includes('anniversary') || tLower.includes('rose') || tLower.includes('music box') || tLower.includes('bouquet') || tLower.includes('couple') || tLower.includes('dashboard')) {
    guessedCategory = 'Gifts';
  } else if (tLower.includes('bottle') || tLower.includes('cup') || tLower.includes('lamp') || tLower.includes('tissue') || tLower.includes('organizer') || tLower.includes('decor') || tLower.includes('home') || tLower.includes('tongs') || tLower.includes('mask') || tLower.includes('pillow')) {
    guessedCategory = 'Home & Living';
  }

  // --- 2. GLOBAL HANDLERS ---

  // Grab specs from MoveDrop Description Tab
  window.__zaynGrabDescription = async function() {
    const descTextarea = document.getElementById('zayn-desc');
    const grabBtn = document.getElementById('zayn-grab-desc-btn');
    if (grabBtn) {
      grabBtn.textContent = '⏳ Grabbing Specs from MoveDrop…';
      grabBtn.disabled = true;
    }

    // 1. Check current DOM
    let text = findEditorText();

    // 2. If not found, find and click the MoveDrop "Description" tab
    if (!text || text.length < 20) {
      const allTabs = Array.from(document.querySelectorAll('div, button, span, a, [role="tab"], li'));
      const descTab = allTabs.find(el => {
        const t = (el.innerText || el.textContent || '').trim();
        return (t === 'Description' || t === 'Descriptions' || t === 'Product Description') && el.children.length === 0;
      });

      if (descTab) {
        descTab.click();
        await new Promise(r => setTimeout(r, 450));
        text = findEditorText();
      }
    }

    if (text && text.trim().length > 15) {
      if (descTextarea) {
        descTextarea.value = text.trim();
        descTextarea.style.borderColor = '#059669';
      }
      if (grabBtn) {
        grabBtn.disabled = false;
        grabBtn.innerHTML = '✅ MoveDrop Specs Grabbed!';
        setTimeout(() => {
          grabBtn.innerHTML = '📋 Auto-Grab Specs from MoveDrop';
        }, 2500);
      }
    } else {
      if (grabBtn) {
        grabBtn.disabled = false;
        grabBtn.innerHTML = '⚠️ Click "Description" Tab in MoveDrop & Retry';
        setTimeout(() => {
          grabBtn.innerHTML = '📋 Auto-Grab Specs from MoveDrop';
        }, 3000);
      }
    }
  };

  // Submit to Google Sheet Webhook
  window.__zaynShopSubmit = async function(btn) {
    const btnText = document.getElementById('zayn-btn-text');
    const statusMsg = document.getElementById('zayn-status-msg');

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.75';
    }
    if (btnText) btnText.textContent = '⏳ Importing to Zayn Shop…';
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#0284c7';
      statusMsg.innerHTML = 'Connecting to Google Sheets…';
    }

    try {
      const nameVal = (document.getElementById('zayn-title')?.value || '').trim();
      const priceVal = parseInt(document.getElementById('zayn-price')?.value, 10);
      const regPriceVal = parseInt(document.getElementById('zayn-reg-price')?.value, 10) || Math.round(priceVal * 1.25);
      const catVal = document.getElementById('zayn-category')?.value || 'Home & Living';
      const imgVal = (document.getElementById('zayn-img-url')?.value || '').trim();
      const descVal = (document.getElementById('zayn-desc')?.value || '').trim();

      if (!nameVal) {
        alert('Product title cannot be empty.');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        if (btnText) btnText.textContent = '🚀 Import to Zayn Shop Store';
        return;
      }
      if (!priceVal || isNaN(priceVal)) {
        alert('Please enter a valid price (e.g. 1111).');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        if (btnText) btnText.textContent = '🚀 Import to Zayn Shop Store';
        return;
      }

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

      // Send to Google Sheet Webhook
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (btn) {
        btn.style.background = '#059669';
        btn.style.opacity = '1';
      }
      if (btnText) btnText.textContent = '✅ Product Imported Successfully!';
      if (statusMsg) {
        statusMsg.style.color = '#059669';
        statusMsg.innerHTML = '🎉 <b>Product successfully added to Zayn Shop!</b><br><span style="font-size:11px;color:#64748b">Synced to Google Sheet & website.</span>';
      }

      alert('🎉 Success! Product added to Zayn Shop!\n\nTitle: ' + nameVal + '\nCategory: ' + catVal + '\nPrice: ৳' + priceVal);

      setTimeout(() => {
        const modal = document.getElementById('zayn-shop-importer-modal');
        if (modal) modal.remove();
      }, 2000);

    } catch (err) {
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
      if (btnText) btnText.textContent = '🚀 Try Again';
      if (statusMsg) {
        statusMsg.style.color = '#e11d48';
        statusMsg.textContent = 'Error: ' + err.message;
      }
      alert('Import error: ' + err.message);
    }
  };

  // --- 3. CREATE FLOATING MODAL OVER MOVEDROP ---
  const modal = document.createElement('div');
  modal.id = 'zayn-shop-importer-modal';
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 440px;
    max-width: 92vw;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1);
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    overflow: hidden;
    animation: zaynSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto !important;
  `;

  // Inject CSS Keyframe & Styles
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
        pointer-events: auto !important;
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

  // 10 Authentic Store Categories
  const storeCategories = [
    { id: 'Beauty & Skincare', icon: '💄' },
    { id: 'Jewelry & Accessories', icon: '💎' },
    { id: 'Kids & Toys', icon: '🧸' },
    { id: 'Home & Living', icon: '🏡' },
    { id: 'Gifts', icon: '🎁' },
    { id: 'Winter Collection', icon: '❄️' },
    { id: 'DIY & Crafts', icon: '🎨' },
    { id: 'Bags & Pouches', icon: '👜' },
    { id: 'Pet Supplies', icon: '🐾' },
    { id: 'Stationery & Books', icon: '📚' }
  ];

  const catOptionsHtml = storeCategories.map(c => `
    <option value="${c.id}" ${guessedCategory === c.id ? 'selected' : ''}>
      ${c.icon} ${c.id}
    </option>
  `).join('');

  modal.innerHTML = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); color: #ffffff; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⚡</span>
        <div>
          <div style="font-size: 14px; font-weight: 800; letter-spacing: -0.2px;">Zayn Shop Importer</div>
          <div style="font-size: 11px; opacity: 0.75;">MoveDrop 1-Click Sync</div>
        </div>
      </div>
      <button type="button" onclick="document.getElementById('zayn-shop-importer-modal').remove()" style="background: none; border: none; color: #ffffff; font-size: 20px; cursor: pointer; opacity: 0.8; line-height: 1;">✕</button>
    </div>

    <!-- Body -->
    <div style="padding: 16px; max-height: 78vh; overflow-y: auto;">
      
      <!-- Main Image Preview + Thumbnails -->
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <img id="zayn-preview-img" src="${selectedImg}" style="width: 76px; height: 76px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0;">
        <div style="flex: 1; min-width: 0;">
          <label style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product Image (Click to pick)</label>
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

      <!-- Category (All 10 Categories) -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Category *</label>
        <select id="zayn-category" class="zayn-inp">
          ${catOptionsHtml}
        </select>
      </div>

      <!-- Description Header + Auto Grab Button -->
      <div style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
          <label style="font-size: 12px; font-weight: 700; color: #334155;">Description / Specifications</label>
          <button type="button" id="zayn-grab-desc-btn" onclick="window.__zaynGrabDescription()" style="
            background: #f1f5f9;
            color: #2563eb;
            border: 1px solid #cbd5e1;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          ">📋 Auto-Grab Specs from MoveDrop</button>
        </div>
        <textarea id="zayn-desc" class="zayn-inp" rows="5" style="font-size: 11px; line-height: 1.5; resize: vertical;">${descText}</textarea>
      </div>

      <!-- Submit Button -->
      <button type="button" id="zayn-submit-btn" onclick="window.__zaynShopSubmit(this)" style="
        width: 100%;
        background: linear-gradient(135deg, #e11d48, #f43f5e);
        color: #ffffff;
        border: none;
        padding: 13px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(225,29,72,0.4);
        position: relative;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
      ">
        <span>🚀</span>
        <span id="zayn-btn-text">Import to Zayn Shop Store</span>
      </button>

      <div id="zayn-status-msg" style="margin-top: 10px; text-align: center; font-size: 12px; display: none;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Background check: If default placeholder text is currently loaded, auto-try grabbing MoveDrop specs
  setTimeout(() => {
    const curDesc = document.getElementById('zayn-desc')?.value || '';
    if (curDesc.startsWith('Imported on pre-order')) {
      const liveSpecs = findEditorText();
      if (liveSpecs && liveSpecs.length > 25) {
        const descEl = document.getElementById('zayn-desc');
        if (descEl) descEl.value = liveSpecs;
      }
    }
  }, 350);

  // Bind direct click fallback
  setTimeout(() => {
    const sBtn = document.getElementById('zayn-submit-btn');
    if (sBtn) {
      sBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.__zaynShopSubmit(this);
      });
    }
  }, 50);

})();
