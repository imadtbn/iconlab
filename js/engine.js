/* ============ ICONLAB ENGINE ============ */
const $ = (s, c = document) => c.querySelector(s),
  $$ = (s, c = document) => [...c.querySelectorAll(s)];
const store = {
  get products() {
    try {
      return JSON.parse(localStorage.getItem("il_products")) || null;
    } catch (e) {
      return null;
    }
  },
  set products(v) {
    localStorage.setItem("il_products", JSON.stringify(v));
  },
  get orders() {
    try {
      return JSON.parse(localStorage.getItem("il_orders")) || [];
    } catch (e) {
      return [];
    }
  },
  set orders(v) {
    localStorage.setItem("il_orders", JSON.stringify(v));
  },
  get cart() {
    try {
      return JSON.parse(localStorage.getItem("il_cart")) || [];
    } catch (e) {
      return [];
    }
  },
  set cart(v) {
    localStorage.setItem("il_cart", JSON.stringify(v));
  },
};
function getProducts() {
  let p = store.products;
  if (!p) {
    p = DEFAULT_PRODUCTS;
    store.products = p;
  }
  return p;
}
function getProduct(id) {
  return getProducts().find((p) => p.id === id);
}
function toast(msg) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}
function money(n) {
  return n.toLocaleString("fr-DZ") + " DA";
}
function esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
}

/* ---------- HEADER / FOOTER ---------- */
const PAGES = [
  ["index.html", "Home"],
  ["shop.html", "Shop"],
  ["customizer.html", "Customize"],
  ["about.html", "About"],
  ["contact.html", "Contact"],
  ["faq.html", "FAQ"],
];
function renderHeader(active) {
  const links = PAGES.map(
    ([h, l]) =>
      `<a href="${h}" class="${active === l ? "active" : ""}">${l}</a>`,
  ).join("");
  const el = document.createElement("header");
  el.innerHTML = `<div class="container nav">
    <a href="index.html" class="logo"><img src="assets/images/IMG-20261001-WA0000.jpg" alt="IconLab Logo" style="height:36px;width:36px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold)">ICON<span>LAB</span></a>
    <nav class="nav-links" id="navLinks">${links}</nav>
    <div class="nav-icons">
      <a href="cart.html" class="icon-btn" title="Cart">🛒<span class="cart-count" id="cartCount" style="display:none">0</span></a>
      <button class="burger" id="burger" type="button" aria-label="فتح القائمة" aria-controls="navLinks" aria-expanded="false">☰</button>
    </div></div>`;
  document.body.prepend(el);
  $("#burger").onclick = () => {
    const nav = $("#navLinks");
    const isOpen = nav.classList.toggle("open");
    $("#burger").setAttribute("aria-expanded", String(isOpen));
    $("#burger").setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
  };
  updateCartCount();
}
function updateCartCount() {
  const c = store.cart.reduce((a, i) => a + i.qty, 0);
  const b = $("#cartCount");
  if (b) {
    b.textContent = c;
    b.style.display = c ? "flex" : "none";
  }
}
function renderFooter() {
  const el = document.createElement("footer");
  el.innerHTML = `<div class="container"><div class="footer-grid">
    <div><a href="index.html" class="logo" style="margin-bottom:14px"><img src="assets/images/IMG-20261001-WA0000.jpg" alt="IconLab Logo" style="height:36px;width:36px;border-radius:50%;object-fit:cover;border:1.5px solid var(--gold)">ICON<span>LAB</span></a>
      <p style="color:var(--grey);font-size:13px;max-width:280px">متجرك المتخصص في قمصان كرة القدم مع تخصيص مباشر — اسمك، رقمك، شعارك. جودة برو، توصيل لكل الولايات.</p>
      <div class="socials"><a href="#" title="Instagram">📷</a><a href="#" title="TikTok">🎵</a><a href="#" title="Facebook">📘</a></div></div>
    <div><h4>Shop</h4><a href="shop.html">All Jerseys</a><a href="customizer.html">Customize Yours</a><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a></div>
    <div><h4>Company</h4><a href="about.html">About Us</a><a href="contact.html">Contact</a><a href="faq.html">FAQ</a></div>
    <div><h4>Legal</h4><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a></div>
  </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} IconLab — All rights reserved.</span><span>Cash on Delivery 🇩🇿</span></div></div>`;
  document.body.appendChild(el);
}

/* ============ JERSEY SVG GENERATOR ============ */
function darken(hex, f = 0.6) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f),
    g = Math.round(((n >> 8) & 255) * f),
    b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 150
  );
}
function studioTransform(transforms, key, cx, cy) {
  const t = transforms?.[key] || {};
  const x = Number(t.x || 0);
  const y = Number(t.y || 0);
  const scale = Math.max(0.45, Math.min(2.2, Number(t.scale || 1)));
  const rotation = Number(t.rotation || 0);
  return `translate(${x} ${y}) translate(${cx} ${cy}) rotate(${rotation}) scale(${scale}) translate(${-cx} ${-cy})`;
}

function jerseySVG(p, opt = {}) {
  const hex = opt.color || p.colors[0].hex;
  const dk = darken(hex, 0.72),
    lt = darken(hex, 1.18);
  const dark = isLight(hex) ? "#15151a" : "#f2f2f0";
  const accent =
    p.team === "Les Fennecs"
      ? "#0a6640"
      : p.team === "FC Barcelona"
        ? "#a50044"
        : p.team === "Real Madrid"
          ? "#8a6d1f"
          : "#e3222a";
  const view = opt.view || "front";
  const fontCss = (FONTS.find((f) => f.id === opt.font) || FONTS[0]).css;
  const tc = opt.textColor || "#f2f2f0";
  const logoColor = opt.logoColor || tc;
  const name = (opt.name || "").toUpperCase(),
    number = opt.number || "";
  const chestLogo = opt.chestLogo || "default";
  const sponsorOpt = opt.sponsor || "default";
  const transforms = opt.transforms || {};

  // ---- body path ----
  const body = `M122,64 L162,42 Q200,58 238,42 L278,64 L332,116 L306,168 L284,152 L284,428 Q200,452 116,428 L116,152 L94,168 L68,116 Z`;
  let inner = "";
  if (p.pattern === "stripes" && view === "front")
    inner += `<path d="M100,120 L140,105 L140,432 Q100,425 100,425 Z" fill="${dk}" opacity=".18"/><path d="M180,102 L200,98 L200,446 Q180,444 180,444 Z" fill="${dk}" opacity=".14"/>`;
  if (p.pattern === "blaugrana")
    inner += `<rect x="100" y="150" width="200" height="26" fill="#004d98" opacity=".5"/><rect x="100" y="202" width="200" height="26" fill="#004d98" opacity=".5"/>`;
  if (p.pattern === "retro" && view === "front")
    inner += `<rect x="100" y="330" width="200" height="34" fill="${accent}" opacity=".9"/><rect x="100" y="376" width="200" height="10" fill="${accent}" opacity=".55"/>`;
  // collar
  const collar =
    view === "front"
      ? `<path d="M162,42 Q200,58 238,42 L226,72 Q200,84 174,72 Z" fill="${dk}"/><path d="M174,72 Q200,84 226,72" stroke="${lt}" stroke-width="3" fill="none"/>`
      : `<path d="M162,42 Q200,58 238,42 L230,64 Q200,76 170,64 Z" fill="${dk}"/>`;
  const sleeveLines = `<path d="M94,168 L68,116" stroke="${dk}" stroke-width="10" opacity=".5"/><path d="M306,168 L332,116" stroke="${dk}" stroke-width="10" opacity=".5"/>`;
  let front = "",
    back = "";

  if (view === "front") {
    // Chest Logo rendering
    let crest = "";
    if (chestLogo === "default") {
      crest = `<g transform="translate(140,180)"><path d="M0,0 L24,0 L24,16 Q24,30 12,36 Q0,30 0,16 Z" fill="${dark}"/><path d="M4,5 L20,5 L20,15 Q20,25 12,30 Q4,25 4,15 Z" fill="${accent}"/><text x="12" y="20" text-anchor="middle" font-size="9" font-weight="800" fill="${isLight(hex) ? "#fff" : "#f2f2f0"}" font-family="Arial">${esc((p.team || "IL")[0])}</text></g>`;
    } else if (chestLogo === "qt_dragon") {
      crest = `<g transform="translate(140,180)"><path d="M12,0 L24,12 L18,32 L6,32 L0,12 Z" fill="${logoColor}"/><text x="12" y="22" text-anchor="middle" font-size="12" font-weight="900" fill="${hex}">QT</text></g>`;
    } else if (chestLogo === "iconlab_star") {
      crest = `<g transform="translate(140,180)"><circle r="16" cx="12" cy="16" fill="${logoColor}"/><text x="12" y="21" text-anchor="middle" font-size="14" fill="${hex}">✦</text></g>`;
    }

    const brand = `<text x="258" y="200" text-anchor="middle" font-size="15" font-weight="900" font-style="italic" fill="${logoColor}" font-family="Arial">IL</text>`;

    // Sponsor rendering
    let sponsor = "";
    if (sponsorOpt === "default") {
      sponsor = `<text x="200" y="262" text-anchor="middle" font-size="22" font-weight="900" letter-spacing="4" fill="${logoColor}" font-family="Arial" opacity=".9">${esc((p.team || "").split(" ")[0].toUpperCase().slice(0, 10))}</text>`;
    } else if (sponsorOpt === "iconlab") {
      sponsor = `<text x="200" y="262" text-anchor="middle" font-size="22" font-weight="900" letter-spacing="5" fill="${logoColor}" font-family="Arial">ICONLAB</text>`;
    } else if (sponsorOpt === "fly_emirates") {
      sponsor = `<text x="200" y="258" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="2" fill="${logoColor}" font-family="Arial">FLY EMIRATES</text>`;
    } else if (sponsorOpt === "spotify") {
      sponsor = `<g transform="translate(200,260)"><circle cx="-40" cy="-6" r="10" fill="${logoColor}"/><text x="0" y="0" text-anchor="middle" font-size="18" font-weight="900" letter-spacing="2" fill="${logoColor}" font-family="Arial">Spotify</text></g>`;
    }

    front =
      `<g data-layer="crest" class="studio-layer" transform="${studioTransform(transforms, "crest", 152, 198)}">${crest}</g>` +
      brand +
      `<g data-layer="sponsor" class="studio-layer" transform="${studioTransform(transforms, "sponsor", 200, 260)}">${sponsor}</g>`;
  } else {
    const nm = name
      ? `<text x="200" y="168" text-anchor="middle" font-size="34" font-weight="700" letter-spacing="3" fill="${tc}" style="font-family:${fontCss}">${esc(name)}</text>`
      : "";
    const num = number
      ? `<text x="200" y="310" text-anchor="middle" font-size="120" font-weight="800" fill="${tc}" style="font-family:${fontCss}">${esc(number)}</text>`
      : "";
    const tag =
      !name && !number
        ? `<text x="200" y="230" text-anchor="middle" font-size="14" letter-spacing="4" fill="${dark}" opacity=".5" font-family="Arial">YOUR NAME • YOUR NUMBER</text>`
        : "";
    back = nm + num + tag;
  }
  // patch
  let patch = "";
  if (opt.patch === "ucl")
    patch = `<g transform="translate(292,140)"><circle r="17" fill="#1b2a6b" stroke="#fff" stroke-width="1.5"/><text y="5" text-anchor="middle" font-size="10" fill="#fff" font-family="Arial">★</text></g>`;
  if (opt.patch === "league")
    patch = `<g transform="translate(292,140)"><path d="M0,-16 L14,-10 L11,8 Q0,16 -11,8 L-14,-10 Z" fill="#c19a3d" stroke="#7a5c14" stroke-width="1.5"/></g>`;
  if (opt.patch === "star")
    patch = `<g transform="translate(292,140)"><circle r="15" fill="#fff" stroke="#999"/><text y="5" text-anchor="middle" font-size="11" fill="#111" font-family="Arial">✦</text></g>`;
  if (opt.patch === "wc")
    patch = `<g transform="translate(292,140)"><rect x="-12" y="-16" width="24" height="32" rx="4" fill="#d4af37"/><text y="5" text-anchor="middle" font-size="10" font-weight="800" fill="#111" font-family="Arial">2026</text></g>`;
  if (patch) {
    patch = `<g data-layer="patch" class="studio-layer" transform="${studioTransform(transforms, "patch", 292, 140)}">${patch}</g>`;
  }

  return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="jg${p.id + view}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lt}"/><stop offset=".5" stop-color="${hex}"/><stop offset="1" stop-color="${dk}"/></linearGradient></defs>
    <ellipse cx="200" cy="468" rx="130" ry="14" fill="#000" opacity=".45"/>
    <path d="${body}" fill="url(#jg${p.id + view})" stroke="${dk}" stroke-width="2"/>
    ${inner}${sleeveLines}${collar}${front}${back}${patch}
  </svg>`;
}
function svgToPNG(svgStr, w = 480, h = 600) {
  return new Promise((res) => {
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/png"));
    };
    img.src = url;
  });
}
function productCard(p) {
  const badge =
    p.stock === 0
      ? `<span class="p-badge out">Sold Out</span>`
      : p.badge
        ? `<span class="p-badge ${p.badge === "Limited" ? "gold" : ""}">${p.badge}</span>`
        : "";
  const cust = p.customizable
    ? `<span class="p-custom">✦ Customizable</span>`
    : "";
  const dots = p.colors
    .map((c) => `<span class="dot" style="background:${c.hex}"></span>`)
    .join("");
  const price = p.oldPrice
    ? `${money(p.price)}<span class="old">${money(p.oldPrice)}</span>`
    : money(p.price);
  return `<a href="product.html?id=${p.id}" class="p-card">
    <div class="p-thumb">${badge}${cust}${jerseySVG(p, { view: "front" })}</div>
    <div class="p-info"><span class="p-team">${esc(p.team)}</span><span class="p-name">${esc(p.name)}</span>
    <div class="p-meta"><span class="p-price">${price}</span><span class="p-colors">${dots}</span></div></div></a>`;
}
