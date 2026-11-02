// Zayn Shop BD — Pre-Order & E-Commerce Store Configuration
// 100% Zero-Cost Architecture (GitHub Pages + Google Sheets + Apps Script)

const CONFIG = {
  brandName: "Zayn Shop",
  subTitle: "Pre-Order Global Collection",
  whatsappNumber: "8801860034712", // WhatsApp number for orders
  supportPhone: "01860034712",
  currencySymbol: "৳",
  deliveryDhaka: 70,
  deliveryOutside: 130,
  advanceAmount: 200,
  paymentNumber: "01819740112", // bKash & Nagad number for 200 BDT advance payment
  advanceNotice: "প্রি-অর্ডার কনফার্ম করতে ২০০ টাকা অ্যাডভান্স পেমেন্ট প্রযোজ্য (বিকাশ/নগদ: 01819740112)। বাকি টাকা ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।",
  deliveryTime: "15–25 Days",
  readyStockDeliveryTime: "২–৩ Days",
  
  // Public Google Apps Script Web App URL for order logging, live catalog, coupons and tracking
  orderWebhookUrl: "https://script.google.com/macros/s/AKfycbz6_ZkMemBMd8kUDicKdQtaB-kdNgDonPSTEC1-W6ilwEji7MLcgFzXShKqAKsYxkuv1A/exec",

  // Analytics & Pixel (Optional)
  gtmId: "",           // e.g. "GTM-XXXXXXX"
  metaPixelId: "",     // e.g. "1234567890123456"
  googleAnalyticsId: "" // e.g. "G-XXXXXXXXXX"
};
