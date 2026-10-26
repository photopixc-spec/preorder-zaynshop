/**
 * Zayn Shop BD — Universal Webhook & Product Sync Engine
 * 
 * Handles:
 * 1. Customer orders (logs to "Orders")
 * 2. Serving live products (reads from "Products")
 * 3. 1-Click Product Importer (adds new products from MoveDrop / URL to "Products")
 * 4. 1-Click Product Delete (removes/hides products from "Products")
 * 5. One-click setup of initial 42 products
 */

var ORIGINAL_PRODUCTS = [
  [
    19,
    "Zircon Butterfly Necklace Set",
    "Jewelry & Accessories",
    950,
    1187,
    "images/prod_19.jpg",
    "A delicate butterfly necklace and earring set finished with sparkling zircon stones. Easy to wear every day and a sweet gift idea. Material Zircon stones, titanium-steel pendant, O-chain Size Necklace length approx. 31–40 cm; weight approx. 5 g What's in the box 1 necklace + 1 pa",
    "Pre-Order",
    "Active"
  ],
  [
    27,
    "Stainless Steel Pet Water Fountain 3.2L",
    "Home & Living",
    2750,
    3437,
    "images/prod_27.jpg",
    "A 3.2-litre circulating water fountain that keeps fresh water available for your cat or dog. The parts come apart for easy cleaning and refilling. Material Stainless steel Size Capacity 3.2 L; product weight approx. 820 g Plug EU 2-pin (Type C) adapter + USB – fits standard Bangl",
    "Pre-Order",
    "Active"
  ],
  [
    39,
    "Lip Care Essence Oil",
    "Beauty & Skincare",
    499,
    623,
    "images/prod_39.jpg",
    "A lightweight lip oil that keeps lips feeling soft and moisturised with a glossy, natural-looking shine. Choose from three fruity flavours. Material Lip oil (cosmetic) Size Single tube Shelf life 3 years (supplier data) What's in the box 1 lip oil Origin China (imported on pre-or",
    "Pre-Order",
    "Active"
  ],
  [
    51,
    "Moisturizing Lip Oil",
    "Beauty & Skincare",
    899,
    1123,
    "images/prod_51.jpg",
    "A glossy lip oil that keeps lips feeling soft and moisturised. Pick from five shades for a natural shine. Material Lip oil (cosmetic) Size 7.5 ml; tube approx. 11.5 × 2.4 cm What's in the box 1 lip oil (7.5 ml) Origin China (imported on pre-order) Delivery 15–25 Days How to use A",
    "Pre-Order",
    "Active"
  ],
  [
    67,
    "Crystal Drop Layered Necklace",
    "Jewelry & Accessories",
    1699,
    2123,
    "images/prod_67.jpg",
    "A romantic vintage-inspired necklace with layered faux-pearl strands and sparkling drop details. Lovely for parties, weddings and photoshoots. Material Alloy (electroplated), faux pearls, mixed stone-set pendant Size Length approx. 31–40 cm What's in the box 1 necklace (style as ",
    "Pre-Order",
    "Active"
  ],
  [
    83,
    "Ocean Pearl Layered Necklace",
    "Jewelry & Accessories",
    749,
    936,
    "images/prod_83.jpg",
    "A summery layered necklace with starfish, shell and faux-pearl details. Wear it as a set for an easy beach look. Material Alloy (electroplated), faux pearls, shell-style charms Size Length approx. 41–50 cm What's in the box 1 layered necklace (style as selected) Origin China (imp",
    "Pre-Order",
    "Active"
  ],
  [
    156,
    "Stress Relief Keyboard Keychain",
    "Jewelry & Accessories",
    750,
    937,
    "images/prod_156.jpg",
    "A pocket-sized 26-key keyboard fidget toy you can clip to your bag or keys. Press the keys for a satisfying click anytime. Material Plastic Size Pocket size; approx. 50 g What's in the box 1 keyboard keychain (individually packaged) Origin China (imported on pre-order) Delivery 1",
    "Pre-Order",
    "Active"
  ],
  [
    168,
    "Wealth God Diamond Painting Kit",
    "Jewelry & Accessories",
    1399,
    1748,
    "images/prod_168.jpg",
    "A relaxing DIY diamond painting kit with traditional good-fortune artwork. Place the diamonds on the printed canvas and display it in the included wooden frame. Material Canvas, resin diamonds, natural wooden frame Size Frame approx. 20 cm (Designs 01–06); approx. 220 g What's in",
    "Pre-Order",
    "Active"
  ],
  [
    203,
    "Diamond Painting DIY Kit",
    "Cute & Toys",
    4599,
    5748,
    "images/prod_203.jpg",
    "A large, colourful DIY diamond painting in a traditional art style. Special-shaped acrylic diamonds add extra sparkle when finished. Material Acrylic special-shaped diamonds, canvas, solid-wood frame Size 40 × 50 cm (inner frame) or 47 × 57 cm (with frame); approx. 560 g What's i",
    "Pre-Order",
    "Active"
  ],
  [
    217,
    "Princess Hair Accessories Gift Box",
    "Fashion & Wear",
    4299,
    5373,
    "images/prod_217.jpg",
    "A big, pretty hair-accessory collection packed in a pink jewellery box with mirror – a lovely birthday or Eid gift for girls. Choose the set size that suits you. Material Fabric, plastic and metal accessories Size Piece count depends on option (119–144 pcs); approx. 1 kg What's i",
    "Pre-Order",
    "Active"
  ],
  [
    242,
    "Luxury Birthday Gift Box Set",
    "Jewelry & Accessories",
    4299,
    5373,
    "images/prod_242.jpg",
    "A complete birthday gift box that arrives ready to give. Each set includes a cute bear towel, a dried-flower bouquet and a greeting card, plus a tumbler or mug and extra gifts depending on the set you choose. Material Mixed (see set contents) Size Gift box approx. S 18×20×8 cm / ",
    "Pre-Order",
    "Active"
  ],
  [
    324,
    "Gold Snail Skincare Kit",
    "Beauty & Skincare",
    4999,
    6248,
    "images/prod_324.jpg",
    "A complete daily skincare routine in one gift box – cleanser, toner, lotion, cream, BB cream and eye cream. Designed to keep skin feeling soft and moisturised. Material Cosmetic formulations (see pack for full ingredients) Size Set net contents (supplier): 120 + 120 + 100 + 55 + ",
    "Pre-Order",
    "Active"
  ],
  [
    344,
    "Vitamin C Skincare Set",
    "Beauty & Skincare",
    1699,
    2123,
    "images/prod_344.jpg",
    "A Vitamin C skincare range for your daily routine – a face serum, a foaming cleansing mousse, a face cream and an overnight gel mask. Lightweight textures that leave skin feeling moisturised. Material Cosmetic formulations (see pack for full ingredients) Size Serum 30 ml · Cleans",
    "Pre-Order",
    "Active"
  ],
  [
    360,
    "Rechargeable Split Hand Warmer",
    "Jewelry & Accessories",
    990,
    1237,
    "images/prod_360.jpg",
    "A compact rechargeable hand warmer that splits magnetically into two pieces, so you can warm both hands at once. Choose the Basic one-button version or the Digital Display version with three heat levels. Material ABS Size Packaging approx. 115 × 39 × 126.5 mm; net weight approx. ",
    "Pre-Order",
    "Active"
  ],
  [
    378,
    "Cat Paw USB Hand Warmer",
    "Jewelry & Accessories",
    490,
    612,
    "images/prod_378.jpg",
    "An adorable pocket-sized hand warmer with a cat-paw design and a hanging lanyard. A cute winter gift – choose a colour box or a gift box. Material Electric heating film, built-in rechargeable battery Size Approx. 8 × 7.5 cm + 10 cm lanyard; net weight approx. 50 g Battery 500–800",
    "Pre-Order",
    "Active"
  ],
  [
    644,
    "Glow Turtle Keychain",
    "Cute & Toys",
    390,
    487,
    "images/prod_644.jpg",
    "A cute mini turtle charm on a keyring that glows softly in the dark after charging under light. Collect a few colours or gift a set to friends. \\n \\n \\n \\n Material \\n Glow-in-the-dark charm with metal key ring \\n Size \\n Mini charm, approx. 10 g \\n \\n \\n What's in the box \\n 1 t",
    "Pre-Order",
    "Active"
  ],
  [
    670,
    "Kids Excavator Sand Set",
    "Jewelry & Accessories",
    3079,
    3848,
    "images/prod_670.jpg",
    "A set of large toy construction vehicles for sand and beach play. Depending on the set you choose, you get two or three trucks with moving arms, buckets and a tipping bed – great for pretend play. \\n \\n \\n \\n Material \\n Plastic \\n Size \\n Each vehicle approx. 26–27 × 13–14.5 × 1",
    "Pre-Order",
    "Active"
  ],
  [
    686,
    "Popcorn Drink 2-in-1 Cup",
    "Home & Living",
    559,
    698,
    "images/prod_686.jpg",
    "A fun 2-in-1 cup with a snack bowl on top and a drink cup underneath, plus a handle and straw. Perfect for popcorn and a drink on movie night, games or road trips. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Plastic \\r\\n Weight \\r\\n Approx. 150 g \\r\\n \\r\\n \\r\\n What's in the box \\r\\n 1 cup",
    "Pre-Order",
    "Active"
  ],
  [
    694,
    "Weighted Plush Panda",
    "Cute & Toys",
    3079,
    3848,
    "images/prod_694.jpg",
    "A super-soft plush animal with a gentle weight inside, so it drapes nicely over your shoulders, lap or sofa. Choose panda or one of the other cute animal styles. \\n \\n \\n \\n Material \\n Soft plush with weighted filling \\n Weight \\n Approx. 0.64 kg \\n \\n \\n What's in the box \\n 1 ",
    "Pre-Order",
    "Active"
  ],
  [
    712,
    "Quilted Book Sleeve",
    "Jewelry & Accessories",
    1119,
    1398,
    "images/prod_712.jpg",
    "A soft, padded quilted sleeve that keeps your book or e-reader safe from bends and scratches in your bag. A lovely little gift for book lovers. \\n \\n \\n \\n Material \\n Quilted fabric with padding \\n Weight \\n Approx. 130 g \\n \\n \\n What's in the box \\n 1 book sleeve (design as se",
    "Pre-Order",
    "Active"
  ],
  [
    732,
    "Tumbler Charm Set",
    "Jewelry & Accessories",
    2319,
    2898,
    "images/prod_732.jpg",
    "Dress up your tumbler with this matching accessory set: a straw topper, a silicone cup sleeve, a bow and a fluffy pom-pom charm on a chain. The cup itself is not included. \\n \\n \\n \\n Material \\n Silicone/plastic parts, fabric bow, faux-fur pom-pom, metal chain \\n Size \\n Chain a",
    "Pre-Order",
    "Active"
  ],
  [
    798,
    "Book Index Sticky Tabs",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_798.jpg",
    "Mark your favourite pages, chapters and notes with these writable sticky index tabs. You can write on them with pen or pencil, and they peel off without damaging paper. \\n \\n \\n \\n Material \\n Coated paper + PET film \\n Size \\n Small, medium or large (as selected) \\n \\n \\n What's",
    "Pre-Order",
    "Active"
  ],
  [
    931,
    "Cat Corner Self-Groomer",
    "Jewelry & Accessories",
    659,
    823,
    "images/prod_931.jpg",
    "Cats love to rub against corners – this corner brush lets them scratch and groom themselves while catching loose fur. Mount it on a wall corner or furniture leg at your cat’s cheek height. \\n \\n \\n \\n Material \\n PP plastic \\n Size \\n Approx. 130 × 85 mm or 154 × 85 mm \\n \\n \\n W",
    "Pre-Order",
    "Active"
  ],
  [
    1040,
    "Thumb Book Page Holder",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1040.jpg",
    "A small wooden page holder that sits on your thumb and keeps your book open, so you can read comfortably with one hand. A cute and practical gift for readers. \\n \\n \\n \\n Material \\n Natural walnut wood \\n Size \\n Approx. 2.2 cm thick, pocket size \\n \\n \\n What's in the box \\n 1 ",
    "Pre-Order",
    "Active"
  ],
  [
    1082,
    "Knit Leg Warmers",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1082.jpg",
    "Cozy knitted leg warmers with a relaxed slouchy fit. Wear them over leggings or jeans for a warm, trendy winter look. \\n \\n \\n \\n Material \\n Knitted yarn \\n Size \\n Free size \\n \\n \\n Weight \\n Approx. 50 g per pair \\n What's in the box \\n 1 pair (colour as selected) \\n \\n \\n Or",
    "Pre-Order",
    "Active"
  ],
  [
    1234,
    "Cross-Stitch Embroidery Kit",
    "Jewelry & Accessories",
    1609,
    2011,
    "images/prod_1234.jpg",
    "Everything you need to start embroidery at home. Transfer a letter or motif onto fabric, put it in the hoop and stitch – a relaxing and creative hobby for beginners. \\n \\n \\n \\n Material \\n Wooden hoops, embroidery threads, metal needles \\n What's in the box \\n 2 pattern sheets, ",
    "Pre-Order",
    "Active"
  ],
  [
    1347,
    "Kids Mini Garden Tools",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1347.jpg",
    "A small 3-piece garden tool set with wooden handles – just the right size for children and for potted plants on the balcony. \\n \\n \\n \\n Material \\n Metal heads, wooden handles \\n Size \\n Approx. 21.3 cm, 20.5 cm and 17 cm long \\n \\n \\n What's in the box \\n 3 tools (trowel, shove",
    "Pre-Order",
    "Active"
  ],
  [
    1357,
    "Microwave Bowl Cozy",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1357.jpg",
    "A thick, soft fabric bowl cozy that helps you hold and carry hot bowls from the microwave. Neat stitching and many colours to match your kitchen. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Thick quilted fabric \\r\\n Weight \\r\\n Approx. 30 g \\r\\n \\r\\n \\r\\n What's in the box \\r\\n 1 bowl cozy",
    "Pre-Order",
    "Active"
  ],
  [
    1369,
    "Needle Felting Starter Kit",
    "Jewelry & Accessories",
    2679,
    3348,
    "images/prod_1369.jpg",
    "Make cute little wool figures by poking wool with a felting needle. Start with the entry set or choose a bigger kit with more wool colours and tools. \\n \\n \\n \\n Material \\n Wool, steel felting needles, foam pad \\n What's in the box \\n Depends on kit level – entry set: foam pad, ",
    "Pre-Order",
    "Active"
  ],
  [
    1379,
    "Shrink Film DIY Craft Kit",
    "Cute & Toys",
    759,
    948,
    "images/prod_1379.jpg",
    "Colour the designs, cut them out and shrink them with heat to make your own keychains and charms. Each pack comes with random surprise designs. \\n \\n \\n \\n Material \\n Shrink plastic sheets \\n What's in the box \\n 6 random shrink sheets, colour pencils and accessories as shown \\n",
    "Pre-Order",
    "Active"
  ],
  [
    1387,
    "Cat Paw Food Tongs",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1387.jpg",
    "Small food tongs with a cute cat-paw tip for picking up snacks, fruit or chips without greasy fingers. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Plastic \\r\\n Size \\r\\n Approx. 14.5 × 2 cm \\r\\n \\r\\n \\r\\n Weight \\r\\n Approx. 38 g \\r\\n What's in the box \\r\\n 1 tong (colour as selected) \\r\\n",
    "Pre-Order",
    "Active"
  ],
  [
    1399,
    "Pearl Phone Lanyard Bracelet",
    "Jewelry & Accessories",
    390,
    487,
    "images/prod_1399.jpg",
    "A pretty faux-pearl beaded wrist strap for your phone – keeps it close while adding a cute accessory look. \\n \\n \\n \\n Material \\n Acrylic faux pearls, beads, cord and metal parts \\n Weight \\n Approx. 50 g \\n \\n \\n What's in the box \\n 1 phone lanyard with strap tab (style as sel",
    "Pre-Order",
    "Active"
  ],
  [
    1421,
    "Giant Star Claw Clip",
    "Beauty & Skincare",
    390,
    487,
    "images/prod_1421.jpg",
    "An oversized hollow star claw clip that holds your hair up in seconds. A fun Y2K accessory in bright colours. \\n \\n \\n \\n Material \\n Plastic \\n Size \\n Approx. 15 cm \\n \\n \\n What's in the box \\n 1 claw clip (colour as selected) \\n Origin \\n China (imported on pre-order) \\n \\n \\",
    "Pre-Order",
    "Active"
  ],
  [
    1439,
    "Ice Cream Cone Candle",
    "Home & Living",
    429,
    536,
    "images/prod_1439.jpg",
    "A handmade candle shaped like a scoop of ice cream, with a fluffy textured surface. Cute as décor or as a small gift. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Wax with cotton wick \\r\\n Size \\r\\n Approx. 6.5 cm (2.56 in) \\r\\n \\r\\n \\r\\n Weight \\r\\n Approx. 60 g \\r\\n Colour \\r\\n Purple, or",
    "Pre-Order",
    "Active"
  ],
  [
    1455,
    "Plush Heart Bag Charm",
    "Cute & Toys",
    390,
    487,
    "images/prod_1455.jpg",
    "A small, smiley plush charm with little legs – clip it onto your bag, keys or pencil case, or wear the brooch version on a jacket. \\n \\n \\n \\n Material \\n Plush fabric, metal clip/pin \\n Size \\n Heart approx. 8 × 9 cm; white heart approx. 8.5 × 8 cm; star approx. 9.5 × 10.5 cm; e",
    "Pre-Order",
    "Active"
  ],
  [
    1485,
    "Mushroom Desk Lamp USB",
    "Jewelry & Accessories",
    999,
    1248,
    "images/prod_1485.jpg",
    "A small mushroom-shaped metal desk lamp with a soft, warm glow. Looks lovely on a bedside table, desk or shelf. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Metal body \\r\\n Power \\r\\n USB \\r\\n \\r\\n \\r\\n Weight \\r\\n Approx. 210 g \\r\\n Colour \\r\\n Silver, gold, rose gold, black, white (as sel",
    "Pre-Order",
    "Active"
  ],
  [
    1541,
    "Cherry Shaped Candles",
    "Home & Living",
    390,
    487,
    "images/prod_1541.jpg",
    "Make your cake extra cute with these little cherry-shaped candles – great for birthdays, parties and photos. \\r\\n \\r\\n \\r\\n \\r\\n Material \\r\\n Wax with cotton wick \\r\\n Weight \\r\\n Approx. 20 g \\r\\n \\r\\n \\r\\n What's in the box \\r\\n 1 card of cherry candles as pictured (cake not i",
    "Pre-Order",
    "Active"
  ],
  [
    1548,
    "Bee-Dog Car Dashboard Plush",
    "Cute & Toys",
    1599,
    1998,
    "images/prod_1548.jpg",
    "A funny little plush puppy dressed in a costume, made to sit on your car dashboard, screen top or desk and make every drive a bit happier. \\n \\n \\n \\n Material \\n Plush \\n Weight \\n Approx. 60 g \\n \\n \\n What's in the box \\n 1 plush (size as selected) \\n Origin \\n China (imported",
    "Pre-Order",
    "Active"
  ],
  [
    1558,
    "Rabbit Car Armrest Tissue Box",
    "Jewelry & Accessories",
    2279,
    2848,
    "images/prod_1558.jpg",
    "A cute plush bunny that holds a pack of tissues – sit it on your car armrest, desk or bedside table. \\n \\n \\n \\n Material \\n Plush \\n Weight \\n Approx. 100 g \\n \\n \\n What's in the box \\n 1 plush tissue holder (style as selected). Tissues not included. \\n Origin \\n China (importe",
    "Pre-Order",
    "Active"
  ],
  [
    1568,
    "Plush Seal Pencil Case",
    "Cute & Toys",
    519,
    648,
    "images/prod_1568.jpg",
    "A cuddly seal-shaped plush pencil case with a zip – fits your pens, pencils and little things, and looks adorable on your desk. \\n \\n \\n \\n Material \\n Plush with zip \\n Weight \\n Approx. 60 g \\n \\n \\n What's in the box \\n 1 pencil case (style as selected) \\n Origin \\n China (imp",
    "Pre-Order",
    "Active"
  ],
  [
    1582,
    "Mouse Plush Pencil Case",
    "Cute & Toys",
    579,
    723,
    "images/prod_1582.jpg",
    "A funny plush pencil case shaped like a little mouse, with a long tail and a zip along the back. Holds pens, pencils and small items. \\n \\n \\n \\n Material \\n Plush with zip \\n Size \\n Approx. 23 cm long; body approx. 18 cm, tail approx. 9 cm (supplier measurements) \\n \\n \\n Weigh",
    "Pre-Order",
    "Active"
  ],
  [
    1602,
    "Fluffy Cat Sleep Eye Mask",
    "Jewelry & Accessories",
    889,
    1111,
    "images/prod_1602.jpg",
    "A fluffy cat-face eye mask with a soft faux fur front and a smooth back. Cute for travel, naps or a gift for friends. \\n \\n \\n \\n Material \\n Faux fur front, smooth satin-look back, elastic strap \\n Weight \\n Approx. 140 g \\n \\n \\n What's in the box \\n 1 eye mask (style as select",
    "Pre-Order",
    "Active"
  ]
];

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // --- ACTION: ADD NEW PRODUCT (From Admin / Importer Bookmarklet) ---
    if (data.action === "add_product") {
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) prodSheet = importAllOriginalProducts();

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
        "Active"
      ];
      prodSheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Product added successfully!",
        id: newId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION: UPDATE PRODUCT (From Admin Edit) ---
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

    // --- ACTION: DELETE / HIDE PRODUCT ---
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
      importAllOriginalProducts();
      sheet = ss.getSheetByName("Products");
    }

    if (e && e.parameter && e.parameter.action === "populate") {
      importAllOriginalProducts();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Populated!" })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
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

  var existingData = sheet.getDataRange().getValues();
  var existingIds = {};
  for (var i = 1; i < existingData.length; i++) {
    if (existingData[i][0]) existingIds[String(existingData[i][0])] = true;
  }

  var toAdd = [];
  for (var j = 0; j < ORIGINAL_PRODUCTS.length; j++) {
    var p = ORIGINAL_PRODUCTS[j];
    if (!existingIds[String(p[0])]) {
      toAdd.push(p);
    }
  }

  if (toAdd.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, toAdd.length, 9).setValues(toAdd);
  }

  Logger.log("Imported " + toAdd.length + " products successfully!");
  return sheet;
}
