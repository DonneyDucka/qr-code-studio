/*
 * QR Code Studio - monetisation config
 * ------------------------------------
 * This is the ONLY file you need to touch to start earning.
 * Everything is client-side, so there is no server to run or maintain.
 *
 * 1) GUMROAD_PRODUCT_ID  - sell a "QR Code Studio Pro" product on Gumroad,
 *    enable license keys, and paste the product's permalink here (the bit
 *    after gumroad.com/l/  e.g. "qrpro"). Buyers get a license key that this
 *    app verifies via Gumroad's public API and unlocks Pro. No backend needed.
 *
 * 2) GUMROAD_BUY_URL     - the full checkout URL of that same product.
 *
 * 3) SUPPORT_URL         - optional "buy me a coffee" / Ko-fi link for tips.
 *
 * Leave a value as "" to hide that piece of UI.
 */
window.QRSTUDIO_CONFIG = {
  // Gumroad product permalink (short id) used for license verification.
  GUMROAD_PRODUCT_ID: "",

  // Full Gumroad checkout URL, e.g. "https://yourname.gumroad.com/l/qrpro".
  GUMROAD_BUY_URL: "",

  // Optional tip jar, e.g. "https://ko-fi.com/yourname". Leave "" to hide.
  SUPPORT_URL: "",

  // One-time price shown on the paywall (display only; Gumroad is the source of truth).
  PRICE_LABEL: "$9 once",
};
