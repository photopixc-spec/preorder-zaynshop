/**
 * Zayn Shop BD — Pre-Order Google Sheet Webhook Script
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new) and name it "Zayn Shop Pre-Orders".
 * 2. In the menu, go to: Extensions > Apps Script.
 * 3. Delete any default code in Code.gs, paste this entire file, and click Save (Ctrl+S / Cmd+S).
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Select type: "Web app" (click gear icon next to Select type).
 * 6. Set Description: "Zayn Shop Order Webhook".
 * 7. Set "Execute as": "Me" (your email).
 * 8. Set "Who has access": "Anyone" (important so your storefront can submit orders).
 * 9. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL" (starts with https://script.google.com/macros/s/...).
 * 10. Paste that Web App URL into config.js under orderWebhookUrl.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if the sheet is brand new / empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Order ID",
        "Customer Name",
        "Customer Phone",
        "Delivery Address",
        "Delivery Area",
        "Delivery Charge (৳)",
        "Ordered Items",
        "Subtotal (৳)",
        "Advance Required (৳)",
        "Remaining COD (৳)",
        "Total Order Amount (৳)",
        "Note / Instructions",
        "Order Status"
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#f1f5f9");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    // Format ordered items as clean text
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
      "'" + (data.customerPhone || ""), // Prefix with apostrophe to keep leading zero in Sheets
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

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", orderId: data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Zayn Shop Webhook is active and running!");
}
