# QR Code Studio

A polished, **fully client-side** QR code generator with logo embedding, colors, gradients, custom styles, and PNG/SVG export.
No backend, no database, no server bills - it deploys as static files and runs entirely in the visitor's browser.

Live: https://qr-code-studio.pages.dev

## Why this is genuinely "passive"

- **Zero running cost.** Static files on Cloudflare Pages' free tier. Nothing to keep alive, nothing that can crash at 3am.
- **Zero maintenance.** The QR library is vendored (`vendor/qr-code-styling.js`), so there's no dependency that can break.
- **Backend-free payments.** Pro is unlocked with a Gumroad license key that the app verifies against Gumroad's public API from the browser. Money goes straight to your Gumroad payout account.

## Free vs Pro

| | Free | Pro (one-time) |
| --- | --- | --- |
| Generate QR (URL, Wi-Fi, vCard, etc.) | Yes | Yes |
| Colors + dot styles | Yes | Yes |
| PNG export | up to 512px | up to 2000px |
| Center logo | - | Yes |
| Gradients + corner styles | - | Yes |
| SVG (vector) export | - | Yes |

## Turn on the money (about 5 minutes)

Everything is driven by one file: [`config.js`](./config.js).

1. Create a free account at https://gumroad.com and add a product, e.g. **"QR Code Studio Pro"**, price it (e.g. $9).
2. In the product settings, turn on **"Generate a unique license key per sale"**.
3. Copy the product **permalink** (the bit after `gumroad.com/l/`, e.g. `qrpro`) and the full checkout URL.
4. Put them in `config.js`:
   ```js
   window.QRSTUDIO_CONFIG = {
     GUMROAD_PRODUCT_ID: "qrpro",
     GUMROAD_BUY_URL: "https://YOURNAME.gumroad.com/l/qrpro",
     SUPPORT_URL: "https://ko-fi.com/YOURNAME", // optional tip jar, or ""
     PRICE_LABEL: "$9 once",
   };
   ```
5. Connect your bank/PayPal in Gumroad so payouts reach you.
6. Redeploy: `npx wrangler pages deploy . --project-name qr-code-studio`

That's it. Buyers get a license key, paste it into the paywall, and Pro unlocks. Gumroad handles the checkout, tax, and payout.

> Until you set `GUMROAD_PRODUCT_ID`, any key entered will unlock Pro locally (so you can preview it). Setting the product id switches on real verification.

## Getting traffic (the part that actually earns)

The code is done; income tracks traffic. Cheap, evergreen channels:

- **SEO**: the page already targets "qr code generator with logo". Add a custom domain in Cloudflare Pages and submit `sitemap.xml` to Google Search Console.
- **Directories**: list it on Product Hunt, AlternativeTo, and free-tool roundups.
- **Answer intent**: reply to Reddit/Quora/StackOverflow threads asking "how to add a logo to a QR code".

## Deploy

```sh
npx wrangler pages deploy . --project-name qr-code-studio
```

## Local preview

```sh
npx serve .    # or: python3 -m http.server
```
