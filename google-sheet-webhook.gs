/**
 * Zayn Shop BD — Universal Webhook & Product Sync Engine
 * 
 * Handles:
 * 1. Customer orders (logs to "Orders" tab)
 * 2. Serving live products to store (reads from "Products" tab)
 * 3. 1-Click Product Importer (adds new products from MoveDrop / Admin to "Products" tab)
 * 4. 1-Click Product Edit & Delete (updates/deletes in "Products" tab)
 * 5. Auto-populates all 42 original products if "Products" tab is empty
 */

function doPost(e) {
  try {
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

    // --- ACTION 1: ADD NEW PRODUCT (From Admin / MoveDrop Importer) ---
    if (data.action === "add_product") {
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) {
        prodSheet = ss.insertSheet("Products");
      }
      if (prodSheet.getLastRow() === 0) {
        var headers = ["ID", "Name", "Category", "Price (৳)", "Regular Price (৳)", "Image URL", "Description", "Badge", "Status"];
        prodSheet.appendRow(headers);
        prodSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
        prodSheet.setFrozenRows(1);
      }

      var newId = data.id || Math.floor(1000 + Math.random() * 9000);
      var newRow = [
        newId,
        data.name || "Untitled Product",
        data.category || "Jewelry & Accessories",
        Number(data.price) || 0,
        Number(data.regular_price) || 0,
        data.image || "images/hero_banner.jpg",
        data.description || "",
        data.badge || "Pre-Order",
        data.status || "Active"
      ];
      prodSheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Product added successfully!",
        id: newId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION 2: UPDATE PRODUCT (From Admin Edit) ---
    if (data.action === "update_product") {
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No Products sheet" })).setMimeType(ContentService.MimeType.JSON);

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
          updated = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: updated ? "success" : "not_found",
        message: updated ? "Product updated successfully!" : "Product ID not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION 3: DELETE PRODUCT ---
    if (data.action === "delete_product") {
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No Products sheet" })).setMimeType(ContentService.MimeType.JSON);

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

      return ContentService.createTextOutput(JSON.stringify({
        status: deleted ? "success" : "not_found",
        message: deleted ? "Product deleted!" : "Product ID not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- DEFAULT ACTION: CUSTOMER ORDER SUBMISSION ---
    var orderSheet = ss.getSheetByName("Orders");
    if (!orderSheet) orderSheet = ss.insertSheet("Orders");

    if (orderSheet.getLastRow() === 0) {
      orderSheet.appendRow([
        "Timestamp", "Order ID", "Customer Name", "Customer Phone",
        "Delivery Address", "Delivery Area", "Delivery Charge (৳)",
        "Ordered Items", "Subtotal (৳)", "Advance Required (৳)",
        "Remaining COD (৳)", "Total Order Amount (৳)", "Note / Instructions", "Order Status"
      ]);
      orderSheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#f1f5f9");
      orderSheet.setFrozenRows(1);
    }

    var itemsText = "";
    if (data.items && data.items.length) {
      itemsText = data.items.map(function(item) {
        return item.name + " (" + item.qty + "x ৳" + item.price + " = ৳" + item.subtotal + ")";
      }).join("\n");
    }

    var row = [
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
      data.orderId || "",
      data.customerName || "",
      "'" + (data.customerPhone || ""),
      data.deliveryAddress || "",
      data.deliveryArea || "",
      data.deliveryCharge || 0,
      itemsText,
      (data.totalAmount - data.deliveryCharge) || 0,
      data.advanceAmount || 200,
      data.remainingCod || 0,
      data.totalAmount || 0,
      data.note || "",
      "Pending Advance"
    ];

    orderSheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      orderId: data.orderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Products");
    if (!sheet) {
      sheet = importAllOriginalProducts();
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      sheet = importAllOriginalProducts();
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

      products.push({
        id: Number(id) || (1000 + i),
        name: String(name).trim(),
        category: row[2] ? String(row[2]).trim() : "Jewelry & Accessories",
        price: Number(row[3]) || 0,
        regular_price: Number(row[4]) || 0,
        image: row[5] ? String(row[5]).trim() : "images/hero_banner.jpg",
        description: row[6] ? String(row[6]).trim() : "",
        badge: row[7] ? String(row[7]).trim() : "Pre-Order",
        stock: "Available on Pre-order"
      });
    }

    return ContentService.createTextOutput(JSON.stringify(products)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function importAllOriginalProducts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products");
  if (!sheet) {
    sheet = ss.insertSheet("Products");
  }

  if (sheet.getLastRow() === 0) {
    var headers = ["ID", "Name", "Category", "Price (৳)", "Regular Price (৳)", "Image URL", "Description", "Badge", "Status"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 70);
    sheet.setColumnWidth(2, 260);
    sheet.setColumnWidth(3, 160);
    sheet.setColumnWidth(4, 90);
    sheet.setColumnWidth(5, 120);
    sheet.setColumnWidth(6, 220);
    sheet.setColumnWidth(7, 300);
    sheet.setColumnWidth(8, 100);
    sheet.setColumnWidth(9, 90);
  }

  try {
    var res = UrlFetchApp.fetch("https://photopixc-spec.github.io/preorder-zaynshop/products.json");
    var list = JSON.parse(res.getContentText());
    var existingData = sheet.getDataRange().getValues();
    var existingIds = {};
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][0]) existingIds[String(existingData[i][0])] = true;
    }

    var toAdd = [];
    for (var j = 0; j < list.length; j++) {
      var p = list[j];
      if (!existingIds[String(p.id)]) {
        toAdd.push([
          p.id,
          p.name,
          p.category || "Jewelry & Accessories",
          p.price || 0,
          p.regular_price || Math.round((p.price || 0) * 1.25),
          p.image || "images/hero_banner.jpg",
          p.description || "",
          p.badge || "Pre-Order",
          "Active"
        ]);
      }
    }

    if (toAdd.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toAdd.length, 9).setValues(toAdd);
    }
  } catch (err) {
    Logger.log("Error loading original products: " + err);
  }

  return sheet;
}
