/* Barcode Generator - core app (client-side only). Shares the QR Studio Pro unlock. */
(function () {
  "use strict";

  const CFG = window.QRSTUDIO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "qrstudio_pro_license"; // shared with the QR tool (same origin)

  let proUnlocked = !!localStorage.getItem(STORE_KEY);

  const el = {
    data: $("bc-data"), format: $("format"), displayValue: $("displayValue"),
    fg: $("fg"), bg: $("bg"), transparent: $("transparent"),
    barWidth: $("barWidth"), height: $("height"),
    canvas: $("bc"), error: $("bc-error"),
    dlPng: $("dl-png"), dlHd: $("dl-png-hd"), dlSvg: $("dl-svg"),
    proBadge: $("pro-badge"), proSection: $("pro-section"),
    controls: document.querySelector(".controls"),
    modal: $("pro-modal"), proClose: $("pro-close"),
    buyBtn: $("buy-btn"), priceLabel: $("price-label"),
    license: $("license"), activateBtn: $("activate-btn"), licenseMsg: $("license-msg"),
    supportLine: $("support-line"), supportLink: $("support-link"),
  };

  function options(scale) {
    scale = scale || 1;
    const transparent = proUnlocked && el.transparent.value === "yes";
    return {
      format: el.format.value,
      lineColor: el.fg.value,
      background: transparent ? "transparent" : el.bg.value,
      width: parseInt(el.barWidth.value, 10) * scale,
      height: parseInt(el.height.value, 10) * scale,
      displayValue: el.displayValue.value === "yes",
      fontSize: 18 * scale,
      margin: 10 * scale,
    };
  }

  function render() {
    const value = el.data.value.trim();
    try {
      JsBarcode(el.canvas, value || " ", Object.assign({ valid: throwIfInvalid }, options(1)));
      el.error.hidden = true;
    } catch (e) {
      el.error.textContent = "Invalid value for " + el.format.value + ". Check the required length/characters.";
      el.error.hidden = false;
    }
  }
  function throwIfInvalid(valid) { if (!valid) throw new Error("invalid"); }

  ["data", "format", "displayValue", "fg", "bg", "transparent", "barWidth", "height"].forEach((k) => {
    el[k].addEventListener("input", render);
    el[k].addEventListener("change", render);
  });

  // ---- Downloads -----------------------------------------------------------
  el.dlPng.addEventListener("click", () => downloadPng(1));
  el.dlHd.addEventListener("click", () => { if (requirePro()) downloadPng(4); });
  el.dlSvg.addEventListener("click", () => { if (requirePro()) downloadSvg(); });

  function downloadPng(scale) {
    const value = el.data.value.trim();
    const c = document.createElement("canvas");
    try {
      JsBarcode(c, value || " ", Object.assign({ valid: throwIfInvalid }, options(scale)));
    } catch (e) { return; }
    triggerDownload(c.toDataURL("image/png"), "barcode.png");
  }

  function downloadSvg() {
    const value = el.data.value.trim();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    try {
      JsBarcode(svg, value || " ", Object.assign({ valid: throwIfInvalid }, options(1)));
    } catch (e) { return; }
    const str = new XMLSerializer().serializeToString(svg);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
    triggerDownload(url, "barcode.svg");
  }

  function triggerDownload(href, name) {
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---- Pro gating + modal --------------------------------------------------
  function requirePro() { if (proUnlocked) return true; openModal(); return false; }
  el.proSection.addEventListener("click", (e) => { if (!proUnlocked) { e.preventDefault(); openModal(); } }, true);
  el.proBadge.addEventListener("click", () => { if (!proUnlocked) openModal(); });

  function applyProState() {
    el.controls.classList.toggle("locked", !proUnlocked);
    if (proUnlocked) {
      el.proBadge.textContent = "Pro unlocked";
      el.proBadge.classList.remove("pill-locked");
      el.proBadge.classList.add("pill-pro");
    }
  }

  function openModal() { el.modal.hidden = false; }
  function closeModal() { el.modal.hidden = true; }
  el.proClose.addEventListener("click", closeModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeModal(); });

  // ---- Gumroad license activation (no backend) -----------------------------
  el.activateBtn.addEventListener("click", async () => {
    const key = (el.license.value || "").trim();
    if (!key) return setMsg("Enter your license key.", "err");
    if (!CFG.GUMROAD_PRODUCT_ID) { unlock(key); return setMsg("Pro unlocked (config pending).", "ok"); }
    setMsg("Verifying...", "");
    try {
      const body = new URLSearchParams();
      body.set("product_id", CFG.GUMROAD_PRODUCT_ID);
      body.set("product_permalink", CFG.GUMROAD_PRODUCT_ID);
      body.set("license_key", key);
      body.set("increment_uses_count", "false");
      const res = await fetch("https://api.gumroad.com/v2/licenses/verify", { method: "POST", body });
      const json = await res.json();
      const p = json && json.purchase;
      if (json && json.success && p && !p.refunded && !p.chargebacked && !p.disputed) {
        unlock(key); setMsg("Verified. Pro unlocked - thank you!", "ok"); setTimeout(closeModal, 1200);
      } else {
        setMsg("That license key wasn't valid.", "err");
      }
    } catch (e) { setMsg("Couldn't reach the license server. Try again.", "err"); }
  });

  function unlock(key) { localStorage.setItem(STORE_KEY, key); proUnlocked = true; applyProState(); render(); }
  function setMsg(text, cls) { el.licenseMsg.textContent = text; el.licenseMsg.className = "license-msg" + (cls ? " " + cls : ""); }

  // ---- Config-driven UI ----------------------------------------------------
  if (CFG.PRICE_LABEL) el.priceLabel.textContent = CFG.PRICE_LABEL;
  if (CFG.GUMROAD_BUY_URL) {
    el.buyBtn.href = CFG.GUMROAD_BUY_URL;
  } else {
    el.buyBtn.textContent = "Product coming soon";
    el.buyBtn.removeAttribute("href");
    el.buyBtn.style.pointerEvents = "none";
    el.buyBtn.style.opacity = "0.6";
  }
  if (CFG.SUPPORT_URL) { el.supportLine.hidden = false; el.supportLink.href = CFG.SUPPORT_URL; }

  // ---- Init ----------------------------------------------------------------
  applyProState();
  render();
})();
