/* QR Code Studio - motion layer
   - living cursor-reactive module grid (the authored moment)
   - scan-reveal whenever a code regenerates
   - restrained scroll reveals
   All motion respects prefers-reduced-motion. */
(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveals ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    reveals.forEach((r) => io.observe(r));
  } else {
    reveals.forEach((r) => r.classList.add("in"));
  }

  /* ---------- Scan-reveal on regenerate ---------- */
  const stage = document.getElementById("qr-stage");
  if (stage && !reduce) {
    let t = null;
    const trigger = () => {
      stage.classList.remove("scanning");
      // force reflow so the animation can restart
      void stage.offsetWidth;
      stage.classList.add("scanning");
      clearTimeout(t);
      t = setTimeout(() => stage.classList.remove("scanning"), 700);
    };
    let debounce = null;
    const mo = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(trigger, 30);
    });
    mo.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ["width", "height", "src", "d"] });
  }

  /* ---------- Living module grid ---------- */
  const canvas = document.getElementById("bg-grid");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const CELL = 30;       // grid pitch (css px)
  const SQ = 7;          // module size
  const BASE = 0.05;     // idle alpha
  const REACH = 165;     // cursor influence radius (css px)
  const INK = "23,22,15";
  const ACCENT = "229,54,27";

  let dpr = 1, w = 0, h = 0, cols = 0, rows = 0;
  let accentSeed = [];   // stable per-cell flag for accent tint near cursor
  const pointer = { x: -9999, y: -9999, active: false };
  let raf = null, running = false, lastFrame = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    accentSeed = new Array(cols * rows);
    for (let i = 0; i < accentSeed.length; i++) accentSeed[i] = Math.random() < 0.14;
    draw(performance.now());
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    const wave = reduce ? 0 : now * 0.00025;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL + (CELL - SQ) / 2;
        const y = r * CELL + (CELL - SQ) / 2;

        // slow diagonal shimmer so idle state stays alive but calm
        let a = BASE + (reduce ? 0 : 0.02 * Math.sin(wave + (c + r) * 0.55));
        let useAccent = false;
        let size = SQ;

        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REACH) {
            const f = 1 - dist / REACH;      // 0..1
            a += f * 0.28;
            size = SQ + f * 3.5;
            if (accentSeed[r * cols + c] && f > 0.35) useAccent = true;
          }
        }

        if (a <= 0.012) continue;
        ctx.fillStyle = "rgba(" + (useAccent ? ACCENT : INK) + "," + a.toFixed(3) + ")";
        const off = (size - SQ) / 2;
        ctx.fillRect(x - off, y - off, size, size);
      }
    }
  }

  function loop(now) {
    if (!running) return;
    // ~40fps cap; plenty for a background, saves battery
    if (now - lastFrame > 24) { draw(now); lastFrame = now; }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  if (reduce) {
    resize(); // draw a single static frame
  } else {
    window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; }, { passive: true });
    window.addEventListener("pointerleave", () => { pointer.active = false; });
    window.addEventListener("blur", () => { pointer.active = false; });
    resize();
    start();
  }
})();
