/**
 * Zayn Shop BD — Universal Webhook, E-Commerce Engine & Database API
 * Version: 2.1 (Zero-Cost Architecture)
 * 
 * Capabilities:
 * 1. 1-Click Initial Setup: Creates/updates all tabs, headers (Products, Orders, Coupons, Reviews).
 * 2. Products: Dual Stock ("Ready Stock" / "Pre-Order"), Variants (Sizes/Colors), Multiple Images Gallery.
 * 3. Orders: LockService concurrency protection, Server-side unique Order ID, Honeypot bot protection, Stock decrement.
 * 4. Coupons: Server-side promo code validation & usage tracking.
 * 5. Tracking: Live order status lookup by Order ID or Phone number.
 * 6. Reviews: Customer review submission with Admin moderation workflow.
 * 7. Admin Auth: Secret Token validation for all administrative operations.
 */

// Configuration: Change this token or set "ADMIN_SECRET_TOKEN" in Script Properties
var DEFAULT_ADMIN_TOKEN = "zayn_secret_token_2026";

function getAdminToken() {
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty("ADMIN_SECRET_TOKEN");
    return token ? token : DEFAULT_ADMIN_TOKEN;
  } catch (e) {
    return DEFAULT_ADMIN_TOKEN;
  }
}

/**
 * ===================================================================
 * 1-CLICK DATABASE SETUP FUNCTION
 * Run this function once by selecting "runInitialSetup" and clicking "Run".
 * Or refresh your Google Sheet and click menu: "🚀 Zayn Shop Engine > 1-Click Database Setup".
 * ===================================================================
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🚀 Zayn Shop Engine")
      .addItem("1-Click Database Setup & Column Sync", "runInitialSetup")
      .addItem("Populate 42 Original Products (if empty)", "populateOriginalProductsManual")
      .addToUi();
  } catch (_) {}
}

function runInitialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Products Sheet & 14 Headers
  var prodSheet = ss.getSheetByName("Products");
  if (!prodSheet) {
    prodSheet = ss.insertSheet("Products");
  }

  var prodHeaders = [
    "ID", "Name", "Category", "Price (৳)", "Regular Price (৳)",
    "Image URL", "Description", "Badge", "Status",
    "Additional Images", "Stock Qty", "Stock Status", "Sizes", "Colors"
  ];

  prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setFontWeight("bold").setBackground("#e2e8f0");
  prodSheet.setFrozenRows(1);
  prodSheet.setColumnWidth(1, 70);
  prodSheet.setColumnWidth(2, 260);
  prodSheet.setColumnWidth(3, 160);
  prodSheet.setColumnWidth(4, 90);
  prodSheet.setColumnWidth(5, 120);
  prodSheet.setColumnWidth(6, 220);
  prodSheet.setColumnWidth(7, 300);
  prodSheet.setColumnWidth(8, 110);
  prodSheet.setColumnWidth(9, 90);
  prodSheet.setColumnWidth(10, 200);
  prodSheet.setColumnWidth(11, 90);
  prodSheet.setColumnWidth(12, 110);
  prodSheet.setColumnWidth(13, 130);
  prodSheet.setColumnWidth(14, 130);

  // If Products sheet has only headers, import all 42 products automatically!
  if (prodSheet.getLastRow() <= 1) {
    importAllOriginalProducts(ss);
  }

  // 2. Setup Orders Sheet & 17 Headers
  var orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
  }

  var orderHeaders = [
    "Timestamp", "Order ID", "Customer Name", "Customer Phone",
    "Delivery Address", "Delivery Area", "Delivery Charge (৳)",
    "Ordered Items", "Subtotal (৳)", "Advance Required (৳)",
    "Remaining COD (৳)", "Total Order Amount (৳)", "Note / Instructions",
    "Order Status", "Coupon Code", "Discount (৳)", "Courier Tracking"
  ];

  orderSheet.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  orderSheet.getRange(1, 1, 1, orderHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");
  orderSheet.setFrozenRows(1);

  // 3. Setup Coupons Sheet
  initCouponsSheet(ss);

  // 4. Setup Reviews Sheet
  initReviewsSheet(ss);

  try {
    SpreadsheetApp.getUi().alert("🎉 Zayn Shop Database Setup Completed Successfully!\n\nAll 14 columns, tabs (Products, Orders, Coupons, Reviews) and initial promo code have been created.");
  } catch (_) {
    Logger.log("Database setup completed successfully!");
  }
}

function populateOriginalProductsManual() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  importAllOriginalProducts(ss);
  try {
    SpreadsheetApp.getUi().alert("✅ 42 Original Products have been imported into your Products sheet!");
  } catch (_) {}
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock to avoid race conditions and lost rows
    lock.waitLock(15000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = (data.action || "").trim();

    // ==========================================
    // 1. HONEYPOT BOT PROTECTION
    // ==========================================
    if (data.hp_field || data.website_url_hp) {
      return jsonResponse({
        status: "success",
        orderId: "ZS-" + Math.floor(100000 + Math.random() * 900000),
        message: "Order placed successfully."
      });
    }

    // ==========================================
    // 2. PUBLIC ACTION: CUSTOMER ORDER SUBMISSION
    // ==========================================
    if (!action || action === "submit_order") {
      return handleOrderSubmission(ss, data);
    }

    // ==========================================
    // 3. PUBLIC ACTION: VERIFY COUPON
    // ==========================================
    if (action === "verify_coupon") {
      return handleVerifyCoupon(ss, data);
    }

    // ==========================================
    // 4. PUBLIC ACTION: SUBMIT CUSTOMER REVIEW
    // ==========================================
    if (action === "submit_review") {
      return handleSubmitReview(ss, data);
    }

    // ==========================================
    // 5. PUBLIC ACTION: TRACK ORDER
    // ==========================================
    if (action === "track_order") {
      return handleTrackOrder(ss, data);
    }

    // ==========================================
    // 6. ADMIN OPERATIONS (Require Secret Token)
    // ==========================================
    var providedToken = String(data.adminToken || (e && e.parameter && e.parameter.adminToken) || "").trim();
    if (providedToken !== getAdminToken()) {
      return jsonResponse({
        status: "unauthorized",
        message: "Invalid or missing admin security token."
      });
    }

    if (action === "add_product") {
      return handleAddProduct(ss, data);
    } else if (action === "update_product") {
      return handleUpdateProduct(ss, data);
    } else if (action === "delete_product") {
      return handleDeleteProduct(ss, data);
    } else if (action === "update_order_status") {
      return handleUpdateOrderStatus(ss, data);
    } else if (action === "manage_coupon") {
      return handleManageCoupon(ss, data);
    } else if (action === "moderate_review") {
      return handleModerateReview(ss, data);
    } else if (action === "get_admin_data") {
      return handleGetAdminData(ss);
    }

    return jsonResponse({ status: "error", message: "Unknown action: " + action });

  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action.trim() : "";

    // 1. Live Order Tracking (GET)
    if (action === "track_order") {
      return handleTrackOrder(ss, e.parameter);
    }

    // 2. Verify Coupon (GET)
    if (action === "verify_coupon") {
      return handleVerifyCoupon(ss, e.parameter);
    }

    // 3. Get Approved Reviews for PDP (GET)
    if (action === "get_reviews") {
      return handleGetReviews(ss, e.parameter);
    }

    // 4. Admin Data Fetch (GET with token)
    if (action === "get_admin_data") {
      var token = String(e.parameter.adminToken || "").trim();
      if (token !== getAdminToken()) {
        return jsonResponse({ status: "unauthorized", message: "Unauthorized" });
      }
      return handleGetAdminData(ss);
    }

    // Default Action: Return Live Store Products List
    return handleGetStoreProducts(ss);

  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ===================================================
// HANDLER: STORE PRODUCTS (GET)
// ===================================================
function handleGetStoreProducts(ss) {
  var sheet = ss.getSheetByName("Products");
  if (!sheet) {
    sheet = initProductsSheet(ss);
  }

  ensureProductsSheetSchema(sheet);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    sheet = importAllOriginalProducts(ss);
    data = sheet.getDataRange().getValues();
  }

  var products = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var id = row[0];
    var name = row[1];
    if (!id || !name) continue;

    var status = row[8] ? String(row[8]).trim().toLowerCase() : "active";
    if (status === "hidden" || status === "inactive" || status === "draft" || status === "delete") continue;

    var badge = row[7] ? String(row[7]).trim() : "Pre-Order";
    var stockQty = row[10] !== undefined && row[10] !== "" ? Number(row[10]) : null;
    var stockStatus = row[11] ? String(row[11]).trim() : (badge.toLowerCase().includes("ready") || badge.toLowerCase().includes("in stock") ? "In Stock" : "Pre-Order");
    var sizes = row[12] ? String(row[12]).trim() : "";
    var colors = row[13] ? String(row[13]).trim() : "";
    var additionalImages = row[9] ? String(row[9]).trim() : "";

    products.push({
      id: Number(id) || (1000 + i),
      name: String(name).trim(),
      category: row[2] ? String(row[2]).trim() : "Jewelry & Accessories",
      price: Number(row[3]) || 0,
      regular_price: Number(row[4]) || 0,
      image: row[5] ? String(row[5]).trim() : "images/hero_banner.jpg",
      additional_images: additionalImages ? additionalImages.split(/\r?\n|,/).map(function(s){return s.trim();}).filter(Boolean) : [],
      description: row[6] ? String(row[6]).trim() : "",
      badge: badge,
      stock_qty: stockQty,
      stock_status: stockStatus,
      sizes: sizes ? sizes.split(",").map(function(s){return s.trim();}).filter(Boolean) : [],
      colors: colors ? colors.split(",").map(function(s){return s.trim();}).filter(Boolean) : [],
      status: "Active"
    });
  }

  return ContentService.createTextOutput(JSON.stringify(products)).setMimeType(ContentService.MimeType.JSON);
}

// ===================================================
// HANDLER: ORDER SUBMISSION (POST)
// ===================================================
function handleOrderSubmission(ss, data) {
  var orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = initOrdersSheet(ss);
  }
  ensureOrdersSheetSchema(orderSheet);

  var dateStr = Utilities.formatDate(new Date(), "Asia/Dhaka", "yyMMdd");
  var existingIds = {};
  var oData = orderSheet.getDataRange().getValues();
  for (var k = 1; k < oData.length; k++) {
    if (oData[k][1]) existingIds[String(oData[k][1])] = true;
  }

  var finalOrderId = data.orderId;
  if (!finalOrderId || existingIds[String(finalOrderId)]) {
    var attempts = 0;
    do {
      var randNum = Math.floor(1000 + Math.random() * 9000);
      finalOrderId = "ZS-" + dateStr + "-" + randNum;
      attempts++;
    } while (existingIds[finalOrderId] && attempts < 50);
  }

  var itemsText = "";
  if (data.items && data.items.length) {
    itemsText = data.items.map(function(item) {
      var variantInfo = [];
      if (item.size) variantInfo.push("Size: " + item.size);
      if (item.color) variantInfo.push("Color: " + item.color);
      var vStr = variantInfo.length ? " [" + variantInfo.join(", ") + "]" : "";
      return item.name + vStr + " (" + item.qty + "x ৳" + item.price + " = ৳" + item.subtotal + ")";
    }).join("\n");
  }

  var couponCode = data.couponCode ? String(data.couponCode).trim().toUpperCase() : "NONE";
  var discountAmount = Number(data.discountAmount) || 0;
  var deliveryCharge = Number(data.deliveryCharge) || 0;
  var advanceAmount = Number(data.advanceAmount) || 200;
  var totalAmount = Number(data.totalAmount) || 0;
  var subtotal = Number(data.subtotal) || (totalAmount - deliveryCharge + discountAmount);
  var remainingCod = Math.max(0, totalAmount - advanceAmount);

  var newRow = [
    Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss"),
    finalOrderId,
    data.customerName || "",
    "'" + (data.customerPhone || ""),
    data.deliveryAddress || "",
    data.deliveryArea || "Inside Dhaka",
    deliveryCharge,
    itemsText,
    subtotal,
    advanceAmount,
    remainingCod,
    totalAmount,
    data.note || "",
    "Pending Advance",
    couponCode,
    discountAmount,
    "" // Courier tracking
  ];

  orderSheet.appendRow(newRow);

  try {
    decrementProductStock(ss, data.items);
  } catch (errStock) {
    Logger.log("Stock decrement notice: " + errStock);
  }

  if (couponCode && couponCode !== "NONE") {
    try {
      incrementCouponUsage(ss, couponCode);
    } catch (errCoupon) {
      Logger.log("Coupon increment notice: " + errCoupon);
    }
  }

  return jsonResponse({
    status: "success",
    orderId: finalOrderId,
    message: "Order placed successfully!"
  });
}

function decrementProductStock(ss, items) {
  if (!items || !items.length) return;
  var prodSheet = ss.getSheetByName("Products");
  if (!prodSheet) return;

  var pData = prodSheet.getDataRange().getValues();
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var targetId = String(item.id);
    var qtyBought = Number(item.qty) || 1;

    for (var r = 1; r < pData.length; r++) {
      if (String(pData[r][0]) === targetId) {
        var rowNum = r + 1;
        var currentQty = pData[r][10];
        if (currentQty !== "" && currentQty !== null && !isNaN(currentQty)) {
          var newQty = Math.max(0, Number(currentQty) - qtyBought);
          prodSheet.getRange(rowNum, 11).setValue(newQty);
          if (newQty === 0) {
            prodSheet.getRange(rowNum, 12).setValue("Out of Stock");
          }
        }
        break;
      }
    }
  }
}

function handleVerifyCoupon(ss, data) {
  var code = String(data.code || data.couponCode || "").trim().toUpperCase();
  var subtotal = Number(data.subtotal) || 0;

  if (!code) {
    return jsonResponse({ valid: false, message: "Please enter a coupon code." });
  }

  var cSheet = ss.getSheetByName("Coupons");
  if (!cSheet) {
    cSheet = initCouponsSheet(ss);
  }

  var cData = cSheet.getDataRange().getValues();
  var found = null;
  for (var i = 1; i < cData.length; i++) {
    if (String(cData[i][0]).trim().toUpperCase() === code) {
      found = {
        code: String(cData[i][0]).trim().toUpperCase(),
        type: String(cData[i][1]).trim().toLowerCase(),
        value: Number(cData[i][2]) || 0,
        minOrder: Number(cData[i][3]) || 0,
        maxDiscount: Number(cData[i][4]) || 0,
        expiry: cData[i][5] ? String(cData[i][5]).trim() : "",
        usageLimit: Number(cData[i][6]) || 0,
        timesUsed: Number(cData[i][7]) || 0,
        status: String(cData[i][8]).trim().toLowerCase()
      };
      break;
    }
  }

  if (!found || found.status !== "active") {
    return jsonResponse({ valid: false, message: "Invalid or inactive promo code." });
  }

  if (found.minOrder > 0 && subtotal < found.minOrder) {
    return jsonResponse({
      valid: false,
      message: "This code requires a minimum order of ৳" + found.minOrder.toLocaleString() + "."
    });
  }

  if (found.usageLimit > 0 && found.timesUsed >= found.usageLimit) {
    return jsonResponse({ valid: false, message: "This coupon usage limit has been reached." });
  }

  if (found.expiry) {
    var today = Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd");
    if (found.expiry < today) {
      return jsonResponse({ valid: false, message: "This promo code has expired." });
    }
  }

  var discount = 0;
  if (found.type === "percentage" || found.type === "percent") {
    discount = Math.round(subtotal * (found.value / 100));
    if (found.maxDiscount > 0 && discount > found.maxDiscount) {
      discount = found.maxDiscount;
    }
  } else {
    discount = Math.min(found.value, subtotal);
  }

  return jsonResponse({
    valid: true,
    code: found.code,
    discount: discount,
    message: "Coupon applied: ৳" + discount.toLocaleString() + " discount!"
  });
}

function incrementCouponUsage(ss, code) {
  var cSheet = ss.getSheetByName("Coupons");
  if (!cSheet) return;
  var cData = cSheet.getDataRange().getValues();
  for (var r = 1; r < cData.length; r++) {
    if (String(cData[r][0]).trim().toUpperCase() === code) {
      var current = Number(cData[r][7]) || 0;
      cSheet.getRange(r + 1, 8).setValue(current + 1);
      break;
    }
  }
}

function handleTrackOrder(ss, data) {
  var query = String(data.query || data.orderId || data.phone || "").trim();
  if (!query) {
    return jsonResponse({ status: "error", message: "Please provide an Order ID or Phone number." });
  }

  var cleanQuery = query.replace(/[^0-9a-zA-Z\-]/g, "").toLowerCase();

  var oSheet = ss.getSheetByName("Orders");
  if (!oSheet) {
    return jsonResponse({ status: "error", message: "Orders database not found." });
  }

  var oData = oSheet.getDataRange().getValues();
  var matchedOrders = [];

  for (var i = oData.length - 1; i >= 1; i--) {
    var row = oData[i];
    var rowOrderId = String(row[1] || "").trim().toLowerCase();
    var rowPhone = String(row[3] || "").replace(/[^0-9]/g, "");

    var isOrderMatch = rowOrderId === cleanQuery;
    var isPhoneMatch = cleanQuery.length >= 10 && rowPhone.endsWith(cleanQuery.slice(-10));

    if (isOrderMatch || isPhoneMatch) {
      var p = String(row[3]).replace(/[^0-9]/g, "");
      var maskedPhone = p.length > 6 ? p.slice(0, 3) + "****" + p.slice(-4) : p;

      matchedOrders.push({
        orderId: row[1],
        timestamp: row[0],
        customerName: row[2],
        maskedPhone: maskedPhone,
        deliveryArea: row[5],
        deliveryCharge: Number(row[6]) || 0,
        itemsText: row[7] || "",
        subtotal: Number(row[8]) || 0,
        advanceAmount: Number(row[9]) || 200,
        remainingCod: Number(row[10]) || 0,
        totalAmount: Number(row[11]) || 0,
        status: row[13] || "Pending Advance",
        courierTracking: row[16] || ""
      });

      if (matchedOrders.length >= 5) break;
    }
  }

  if (!matchedOrders.length) {
    return jsonResponse({ status: "not_found", message: "No order found matching your inquiry." });
  }

  return jsonResponse({
    status: "success",
    orders: matchedOrders
  });
}

function handleSubmitReview(ss, data) {
  var rSheet = ss.getSheetByName("Reviews");
  if (!rSheet) {
    rSheet = initReviewsSheet(ss);
  }

  var prodId = String(data.productId || "").trim();
  var name = String(data.name || "Customer").trim().slice(0, 50);
  var rating = Math.min(5, Math.max(1, Number(data.rating) || 5));
  var comment = String(data.comment || "").trim().slice(0, 500);

  if (!prodId || !comment) {
    return jsonResponse({ status: "error", message: "Product ID and review comment are required." });
  }

  rSheet.appendRow([
    Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss"),
    prodId,
    name,
    rating,
    comment,
    "Pending"
  ]);

  return jsonResponse({
    status: "success",
    message: "Thank you! Your review has been submitted for moderation."
  });
}

function handleGetReviews(ss, data) {
  var prodId = String(data.productId || "").trim();
  var rSheet = ss.getSheetByName("Reviews");
  if (!rSheet) return jsonResponse([]);

  var rData = rSheet.getDataRange().getValues();
  var reviews = [];

  for (var i = 1; i < rData.length; i++) {
    var row = rData[i];
    var rowProdId = String(row[1]).trim();
    var status = String(row[5]).trim().toLowerCase();

    if ((!prodId || rowProdId === prodId) && status === "approved") {
      reviews.push({
        date: String(row[0]).split(" ")[0],
        productId: rowProdId,
        name: row[2] || "Customer",
        rating: Number(row[3]) || 5,
        comment: row[4] || ""
      });
    }
  }

  return jsonResponse(reviews.reverse());
}

function handleAddProduct(ss, data) {
  var prodSheet = ss.getSheetByName("Products");
  if (!prodSheet) prodSheet = initProductsSheet(ss);
  ensureProductsSheetSchema(prodSheet);

  var newId = data.id || Math.floor(1000 + Math.random() * 9000);
  var addlImgs = Array.isArray(data.additional_images) ? data.additional_images.join("\n") : (data.additional_images || "");
  var sizes = Array.isArray(data.sizes) ? data.sizes.join(", ") : (data.sizes || "");
  var colors = Array.isArray(data.colors) ? data.colors.join(", ") : (data.colors || "");

  var newRow = [
    newId,
    data.name || "Untitled Product",
    data.category || "Jewelry & Accessories",
    Number(data.price) || 0,
    Number(data.regular_price) || 0,
    data.image || "images/hero_banner.jpg",
    data.description || "",
    data.badge || "Pre-Order",
    data.status || "Active",
    addlImgs,
    data.stock_qty !== undefined && data.stock_qty !== "" ? Number(data.stock_qty) : "",
    data.stock_status || "Pre-Order",
    sizes,
    colors
  ];

  prodSheet.appendRow(newRow);

  return jsonResponse({
    status: "success",
    message: "Product added successfully!",
    id: newId
  });
}

function handleUpdateProduct(ss, data) {
  var prodSheet = ss.getSheetByName("Products");
  if (!prodSheet) return jsonResponse({ status: "error", message: "No Products sheet" });
  ensureProductsSheetSchema(prodSheet);

  var pData = prodSheet.getDataRange().getValues();
  var targetId = String(data.id);
  var updated = false;

  for (var r = 1; r < pData.length; r++) {
    if (String(pData[r][0]) === targetId) {
      var rowNum = r + 1;
      if (data.name !== undefined) prodSheet.getRange(rowNum, 2).setValue(data.name);
      if (data.category !== undefined) prodSheet.getRange(rowNum, 3).setValue(data.category);
      if (data.price !== undefined) prodSheet.getRange(rowNum, 4).setValue(Number(data.price));
      if (data.regular_price !== undefined) prodSheet.getRange(rowNum, 5).setValue(Number(data.regular_price));
      if (data.image !== undefined) prodSheet.getRange(rowNum, 6).setValue(data.image);
      if (data.description !== undefined) prodSheet.getRange(rowNum, 7).setValue(data.description);
      if (data.badge !== undefined) prodSheet.getRange(rowNum, 8).setValue(data.badge);
      if (data.status !== undefined) prodSheet.getRange(rowNum, 9).setValue(data.status);
      if (data.additional_images !== undefined) {
        var aImgs = Array.isArray(data.additional_images) ? data.additional_images.join("\n") : data.additional_images;
        prodSheet.getRange(rowNum, 10).setValue(aImgs);
      }
      if (data.stock_qty !== undefined) prodSheet.getRange(rowNum, 11).setValue(data.stock_qty === "" ? "" : Number(data.stock_qty));
      if (data.stock_status !== undefined) prodSheet.getRange(rowNum, 12).setValue(data.stock_status);
      if (data.sizes !== undefined) {
        var sz = Array.isArray(data.sizes) ? data.sizes.join(", ") : data.sizes;
        prodSheet.getRange(rowNum, 13).setValue(sz);
      }
      if (data.colors !== undefined) {
        var cl = Array.isArray(data.colors) ? data.colors.join(", ") : data.colors;
        prodSheet.getRange(rowNum, 14).setValue(cl);
      }
      updated = true;
      break;
    }
  }

  return jsonResponse({
    status: updated ? "success" : "not_found",
    message: updated ? "Product updated successfully!" : "Product ID not found"
  });
}

function handleDeleteProduct(ss, data) {
  var prodSheet = ss.getSheetByName("Products");
  if (!prodSheet) return jsonResponse({ status: "error", message: "No Products sheet" });

  var pData = prodSheet.getDataRange().getValues();
  var targetId = String(data.id);
  var deleted = false;

  for (var r = pData.length - 1; r >= 1; r--) {
    if (String(pData[r][0]) === targetId) {
      prodSheet.deleteRow(r + 1);
      deleted = true;
      break;
    }
  }

  return jsonResponse({
    status: deleted ? "success" : "not_found",
    message: deleted ? "Product deleted!" : "Product ID not found"
  });
}

function handleUpdateOrderStatus(ss, data) {
  var oSheet = ss.getSheetByName("Orders");
  if (!oSheet) return jsonResponse({ status: "error", message: "No Orders sheet" });

  var targetOrderId = String(data.orderId || "").trim();
  var newStatus = String(data.status || "").trim();
  var courier = data.courierTracking !== undefined ? String(data.courierTracking).trim() : null;

  var oData = oSheet.getDataRange().getValues();
  var updated = false;

  for (var r = 1; r < oData.length; r++) {
    if (String(oData[r][1]).trim() === targetOrderId) {
      var rowNum = r + 1;
      if (newStatus) oSheet.getRange(rowNum, 14).setValue(newStatus);
      if (courier !== null) oSheet.getRange(rowNum, 17).setValue(courier);
      updated = true;
      break;
    }
  }

  return jsonResponse({
    status: updated ? "success" : "not_found",
    message: updated ? "Order updated successfully!" : "Order not found"
  });
}

function handleManageCoupon(ss, data) {
  var cSheet = ss.getSheetByName("Coupons");
  if (!cSheet) cSheet = initCouponsSheet(ss);

  var subAction = data.subAction || "add";
  var code = String(data.code || "").trim().toUpperCase();

  if (!code) return jsonResponse({ status: "error", message: "Coupon code required." });

  var cData = cSheet.getDataRange().getValues();

  if (subAction === "delete") {
    for (var r = cData.length - 1; r >= 1; r--) {
      if (String(cData[r][0]).trim().toUpperCase() === code) {
        cSheet.deleteRow(r + 1);
        return jsonResponse({ status: "success", message: "Coupon deleted!" });
      }
    }
    return jsonResponse({ status: "not_found", message: "Coupon not found" });
  }

  var foundRow = 0;
  for (var i = 1; i < cData.length; i++) {
    if (String(cData[i][0]).trim().toUpperCase() === code) {
      foundRow = i + 1;
      break;
    }
  }

  var rowVals = [
    code,
    data.type || "flat",
    Number(data.value) || 0,
    Number(data.minOrder) || 0,
    Number(data.maxDiscount) || 0,
    data.expiry || "",
    Number(data.usageLimit) || 0,
    foundRow ? cData[foundRow - 1][7] : 0,
    data.status || "Active"
  ];

  if (foundRow) {
    cSheet.getRange(foundRow, 1, 1, rowVals.length).setValues([rowVals]);
    return jsonResponse({ status: "success", message: "Coupon updated!" });
  } else {
    cSheet.appendRow(rowVals);
    return jsonResponse({ status: "success", message: "Coupon created!" });
  }
}

function handleModerateReview(ss, data) {
  var rSheet = ss.getSheetByName("Reviews");
  if (!rSheet) return jsonResponse({ status: "error", message: "Reviews sheet not found" });

  var rowIndex = Number(data.rowIndex);
  var newStatus = String(data.status || "").trim();

  if (!rowIndex || rowIndex < 2) {
    return jsonResponse({ status: "error", message: "Invalid review row index." });
  }

  rSheet.getRange(rowIndex, 6).setValue(newStatus);
  return jsonResponse({ status: "success", message: "Review marked as " + newStatus });
}

function handleGetAdminData(ss) {
  var oSheet = ss.getSheetByName("Orders");
  var orders = [];
  if (oSheet) {
    var oData = oSheet.getDataRange().getValues();
    for (var i = 1; i < oData.length; i++) {
      orders.push({
        rowIndex: i + 1,
        timestamp: oData[i][0],
        orderId: oData[i][1],
        customerName: oData[i][2],
        customerPhone: oData[i][3],
        deliveryAddress: oData[i][4],
        deliveryArea: oData[i][5],
        deliveryCharge: oData[i][6],
        orderedItems: oData[i][7],
        subtotal: oData[i][8],
        advanceAmount: oData[i][9],
        remainingCod: oData[i][10],
        totalAmount: oData[i][11],
        note: oData[i][12],
        status: oData[i][13],
        couponCode: oData[i][14] || "",
        discount: oData[i][15] || 0,
        courierTracking: oData[i][16] || ""
      });
    }
  }

  var cSheet = ss.getSheetByName("Coupons");
  var coupons = [];
  if (cSheet) {
    var cData = cSheet.getDataRange().getValues();
    for (var j = 1; j < cData.length; j++) {
      coupons.push({
        code: cData[j][0],
        type: cData[j][1],
        value: cData[j][2],
        minOrder: cData[j][3],
        maxDiscount: cData[j][4],
        expiry: cData[j][5],
        usageLimit: cData[j][6],
        timesUsed: cData[j][7],
        status: cData[j][8]
      });
    }
  }

  var rSheet = ss.getSheetByName("Reviews");
  var reviews = [];
  if (rSheet) {
    var rData = rSheet.getDataRange().getValues();
    for (var k = 1; k < rData.length; k++) {
      reviews.push({
        rowIndex: k + 1,
        timestamp: rData[k][0],
        productId: rData[k][1],
        customerName: rData[k][2],
        rating: rData[k][3],
        comment: rData[k][4],
        status: rData[k][5]
      });
    }
  }

  return jsonResponse({
    status: "success",
    orders: orders.reverse(),
    coupons: coupons,
    reviews: reviews.reverse()
  });
}

function initProductsSheet(ss) {
  var sheet = ss.getSheetByName("Products");
  if (!sheet) sheet = ss.insertSheet("Products");

  var headers = [
    "ID", "Name", "Category", "Price (৳)", "Regular Price (৳)",
    "Image URL", "Description", "Badge", "Status",
    "Additional Images", "Stock Qty", "Stock Status", "Sizes", "Colors"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureProductsSheetSchema(sheet) {
  var fullHeaders = [
    "ID", "Name", "Category", "Price (৳)", "Regular Price (৳)",
    "Image URL", "Description", "Badge", "Status",
    "Additional Images", "Stock Qty", "Stock Status", "Sizes", "Colors"
  ];
  sheet.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
  sheet.getRange(1, 1, 1, fullHeaders.length).setFontWeight("bold").setBackground("#e2e8f0");
  sheet.setFrozenRows(1);
}

function initOrdersSheet(ss) {
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) sheet = ss.insertSheet("Orders");

  var headers = [
    "Timestamp", "Order ID", "Customer Name", "Customer Phone",
    "Delivery Address", "Delivery Area", "Delivery Charge (৳)",
    "Ordered Items", "Subtotal (৳)", "Advance Required (৳)",
    "Remaining COD (৳)", "Total Order Amount (৳)", "Note / Instructions",
    "Order Status", "Coupon Code", "Discount (৳)", "Courier Tracking"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f1f5f9");
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureOrdersSheetSchema(sheet) {
  var fullHeaders = [
    "Timestamp", "Order ID", "Customer Name", "Customer Phone",
    "Delivery Address", "Delivery Area", "Delivery Charge (৳)",
    "Ordered Items", "Subtotal (৳)", "Advance Required (৳)",
    "Remaining COD (৳)", "Total Order Amount (৳)", "Note / Instructions",
    "Order Status", "Coupon Code", "Discount (৳)", "Courier Tracking"
  ];
  sheet.getRange(1, 1, 1, fullHeaders.length).setValues([fullHeaders]);
  sheet.getRange(1, 1, 1, fullHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");
  sheet.setFrozenRows(1);
}

function initCouponsSheet(ss) {
  var sheet = ss.getSheetByName("Coupons");
  if (!sheet) {
    sheet = ss.insertSheet("Coupons");
  }

  var headers = [
    "Coupon Code", "Discount Type", "Discount Value", "Min Order (৳)",
    "Max Discount (৳)", "Expiry Date", "Usage Limit", "Times Used", "Status"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#fef08a");
  sheet.setFrozenRows(1);

  if (sheet.getLastRow() <= 1) {
    sheet.appendRow(["WELCOME50", "flat", 50, 500, 50, "2027-12-31", 1000, 0, "Active"]);
  }
  return sheet;
}

function initReviewsSheet(ss) {
  var sheet = ss.getSheetByName("Reviews");
  if (!sheet) {
    sheet = ss.insertSheet("Reviews");
  }
  var headers = ["Timestamp", "Product ID", "Customer Name", "Rating", "Review Text", "Status"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
  sheet.setFrozenRows(1);
  return sheet;
}

function importAllOriginalProducts(ss) {
  var sheet = ss.getSheetByName("Products");
  if (!sheet) sheet = initProductsSheet(ss);

  try {
    var jsonUrl = "https://preorder.zaynshopbd.com/products.json";
    var res;
    try {
      res = UrlFetchApp.fetch(jsonUrl);
    } catch (_) {
      res = UrlFetchApp.fetch("https://photopixc-spec.github.io/preorder-zaynshop/products.json");
    }
    var list = JSON.parse(res.getContentText());
    var toAdd = [];
    for (var j = 0; j < list.length; j++) {
      var p = list[j];
      toAdd.push([
        p.id,
        p.name,
        p.category || "Jewelry & Accessories",
        p.price || 0,
        p.regular_price || Math.round((p.price || 0) * 1.25),
        p.image || "images/hero_banner.jpg",
        p.description || "",
        p.badge || "Pre-Order",
        "Active",
        "", // Additional images
        "", // Stock Qty
        "Pre-Order",
        "", // Sizes
        ""  // Colors
      ]);
    }
    if (toAdd.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toAdd.length, 14).setValues(toAdd);
    }
  } catch (err) {
    Logger.log("Error importing initial products: " + err);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
