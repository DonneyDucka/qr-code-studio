/* QR Code Studio - core app (client-side only) */
(function () {
  "use strict";

  const CFG = window.QRSTUDIO_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const PREVIEW_SIZE = 560; // rendered size; CSS scales into the box
  const FREE_MAX = 512;
  const PRO_MAX = 2000;
  const STORE_KEY = "qrstudio_pro_license";

  // ---- Pro state -----------------------------------------------------------
  let proUnlocked = !!localStorage.getItem(STORE_KEY);
  let logoDataUrl = null;

  // ---- Elements ------------------------------------------------------------
  const el = {
    data: $("qr-data"),
    fg: $("fg"), bg: $("bg"), fg2: $("fg2"),
    dotStyle: $("dotStyle"), cornerStyle: $("cornerStyle"),
    gradient: $("gradient"), gradientWrap: $("gradient-color-wrap"),
    logo: $("logo"), clearLogo: $("clear-logo"),
    canvas: $("qr-canvas"),
    size: $("size"), sizeOut: $("size-out"),
    dlPng: $("dl-png"), dlSvg: $("dl-svg"),
    proBadge: $("pro-badge"), proSection: $("pro-section"),
    controls: document.querySelector(".controls"),
    modal: $("pro-modal"), proClose: $("pro-close"),
    buyBtn: $("buy-btn"), priceLabel: $("price-label"),
    license: $("license"), activateBtn: $("activate-btn"), licenseMsg: $("license-msg"),
    supportLine: $("support-line"), supportLink: $("support-link"),
  };

  // ---- QR instance ---------------------------------------------------------
  const qr = new QRCodeStyling(buildOptions(PREVIEW_SIZE));
  qr.append(el.canvas);

  function activeGradient() {
    if (!proUnlocked || el.gradient.value === "none") return undefined;
    return {
      type: el.gradient.value, // "linear" | "radial"
      rotation: 0.785,
      colorStops: [
        { offset: 0, color: el.fg.value },
        { offset: 1, color: el.fg2.value },
      ],
    };
  }

  function buildOptions(size) {
    const gradient = activeGradient();
    const useLogo = proUnlocked && logoDataUrl;
    return {
      width: size,
      height: size,
      type: "canvas",
      data: el.data.value || " ",
      image: useLogo ? logoDataUrl : undefined,
      margin: 8,
      qrOptions: { errorCorrectionLevel: useLogo ? "H" : "Q" },
      dotsOptions: {
        type: el.dotStyle.value,
        color: el.fg.value,
        gradient,
      },
      cornersSquareOptions: {
        type: proUnlocked ? el.cornerStyle.value : "extra-rounded",
        color: el.fg.value,
      },
      backgroundOptions: { color: el.bg.value },
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.38, hideBackgroundDots: true },
    };
  }

  const render = debounce(() => qr.update(buildOptions(PREVIEW_SIZE)), 90);

  // ---- Wire inputs ---------------------------------------------------------
  ["data", "fg", "bg", "fg2", "dotStyle", "cornerStyle"].forEach((k) => {
    el[k].addEventListener("input", render);
  });
  el.gradient.addEventListener("change", () => {
    el.gradientWrap.hidden = el.gradient.value === "none";
    render();
  });

  el.size.addEventListener("input", () => {
    el.sizeOut.textContent = el.size.value + "px";
  });

  // Quick templates
  const templates = {
    url: "https://",
    wifi: "WIFI:T:WPA;S:NetworkName;P:password;;",
    email: "mailto:hello@example.com?subject=Hi",
    tel: "tel:+61400000000",
    vcard: "BEGIN:VCARD\nVERSION:3.0\nN:Doe;Jane\nTEL:+61400000000\nEMAIL:jane@example.com\nEND:VCARD",
  };
  document.querySelectorAll("#quicktypes button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#quicktypes button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      el.data.value = templates[b.dataset.tpl] || "";
      render();
    });
  });

  // Logo upload (Pro)
  el.logo.addEventListener("change", (e) => {
    if (!requirePro()) { el.logo.value = ""; return; }
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoDataUrl = reader.result;
      el.clearLogo.hidden = false;
      render();
    };
    reader.readAsDataURL(file);
  });
  el.clearLogo.addEventListener("click", () => {
    logoDataUrl = null;
    el.logo.value = "";
    el.clearLogo.hidden = true;
    render();
  });

  // ---- Downloads -----------------------------------------------------------
  el.dlPng.addEventListener("click", () => exportQR("png"));
  el.dlSvg.addEventListener("click", () => { if (requirePro()) exportQR("svg"); });

  async function exportQR(ext) {
    let size = parseInt(el.size.value, 10);
    if (!proUnlocked && size > FREE_MAX) size = FREE_MAX;
    // Render at full export resolution, download, then restore preview size.
    qr.update(buildOptions(size));
    await nextFrame();
    await qr.download({ name: "qr-code-studio", extension: ext });
    qr.update(buildOptions(PREVIEW_SIZE));
  }

  // ---- Pro gating UI -------------------------------------------------------
  function requirePro() {
    if (proUnlocked) return true;
    openModal();
    return false;
  }

  // Clicking the locked pro area opens the paywall
  el.proSection.addEventListener("click", (e) => {
    if (!proUnlocked) { e.preventDefault(); openModal(); }
  }, true);

  el.proBadge.addEventListener("click", () => {
    if (proUnlocked) return;
    openModal();
  });

  function applyProState() {
    el.controls.classList.toggle("locked", !proUnlocked);
    if (proUnlocked) {
      el.proBadge.textContent = "Pro unlocked";
      el.proBadge.classList.remove("pill-locked");
      el.proBadge.classList.add("pill-pro");
      el.size.max = PRO_MAX;
    } else {
      el.size.max = FREE_MAX;
      if (parseInt(el.size.value, 10) > FREE_MAX) {
        el.size.value = FREE_MAX;
        el.sizeOut.textContent = FREE_MAX + "px";
      }
    }
  }

  // ---- Modal ---------------------------------------------------------------
  function openModal() { el.modal.hidden = false; }
  function closeModal() { el.modal.hidden = true; }
  el.proClose.addEventListener("click", closeModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeModal(); });

  // ---- Gumroad license activation (no backend) -----------------------------
  el.activateBtn.addEventListener("click", async () => {
    const key = (el.license.value || "").trim();
    if (!key) return setMsg("Enter your license key.", "err");
    if (!CFG.GUMROAD_PRODUCT_ID) {
      // Owner hasn't configured a product yet: accept the key locally so the
      // owner can preview Pro. Replace GUMROAD_PRODUCT_ID in config.js to enforce.
      unlock(key);
      return setMsg("Pro unlocked (config pending).", "ok");
    }
    setMsg("Verifying...", "");
    try {
      const body = new URLSearchParams();
      body.set("product_id", CFG.GUMROAD_PRODUCT_ID);
      body.set("product_permalink", CFG.GUMROAD_PRODUCT_ID);
      body.set("license_key", key);
      body.set("increment_uses_count", "false");
      const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST", body,
      });
      const json = await res.json();
      const p = json && json.purchase;
      if (json && json.success && p && !p.refunded && !p.chargebacked && !p.disputed) {
        unlock(key);
        setMsg("Verified. Pro unlocked - thank you!", "ok");
        setTimeout(closeModal, 1200);
      } else {
        setMsg("That license key wasn't valid.", "err");
      }
    } catch (err) {
      setMsg("Couldn't reach the license server. Try again.", "err");
    }
  });

  function unlock(key) {
    localStorage.setItem(STORE_KEY, key);
    proUnlocked = true;
    applyProState();
    render();
  }
  function setMsg(text, cls) {
    el.licenseMsg.textContent = text;
    el.licenseMsg.className = "license-msg" + (cls ? " " + cls : "");
  }

  // ---- Config-driven UI ----------------------------------------------------
  if (CFG.PRICE_LABEL) {
    el.priceLabel.textContent = CFG.PRICE_LABEL;
  }
  if (CFG.GUMROAD_BUY_URL) {
    el.buyBtn.href = CFG.GUMROAD_BUY_URL;
  } else {
    el.buyBtn.textContent = "Product coming soon";
    el.buyBtn.removeAttribute("href");
    el.buyBtn.style.pointerEvents = "none";
    el.buyBtn.style.opacity = "0.6";
  }
  if (CFG.SUPPORT_URL) {
    el.supportLine.hidden = false;
    el.supportLink.href = CFG.SUPPORT_URL;
  }

  // ---- Helpers -------------------------------------------------------------
  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function nextFrame() {
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  // ---- Init ----------------------------------------------------------------
  applyProState();
  render();
})();
