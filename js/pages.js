/* ============ PAGE CONTROLLERS ============ */
document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  renderHeader(document.body.dataset.nav || "");
  renderFooter();
  (
    ({
      home: initHome,
      shop: initShop,
      product: initProduct,
      customizer: initCustomizer,
      cart: initCart,
      checkout: initCheckout,
      confirmation: initConfirmation,
      admin: initAdmin,
      contact: initContact,
    })[page] || (() => {})
  )();
});

/* ---------- HOME ---------- */
function initHome() {
  const ps = getProducts();
  $("#heroJersey").innerHTML = jerseySVG(ps[0], {
    view: "back",
    name: "NOUFEL",
    number: "10",
    textColor: "#d4af37",
  });
  $("#featured").innerHTML = ps.slice(0, 4).map(productCard).join("");
  $("#latest").innerHTML = ps.slice(2, 6).map(productCard).join("");
  $("#year").textContent = new Date().getFullYear();
}

/* ---------- SHOP ---------- */
function initShop() {
  const ps = getProducts();
  const render = (list) => {
    $("#grid").innerHTML = list.length
      ? list.map(productCard).join("")
      : `<p style="color:var(--grey);grid-column:1/-1;text-align:center;padding:40px">لا توجد منتجات مطابقة.</p>`;
  };
  render(ps);
  $("#search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    render(ps.filter((p) => (p.name + p.team).toLowerCase().includes(q)));
  });
  $("#filterCustom").addEventListener("change", (e) => {
    const q = $("#search").value.toLowerCase();
    let list = ps.filter((p) => (p.name + p.team).toLowerCase().includes(q));
    if (e.target.value === "custom") list = list.filter((p) => p.customizable);
    if (e.target.value === "stock") list = list.filter((p) => p.stock > 0);
    render(list);
  });
}

/* ---------- PRODUCT ---------- */
function initProduct() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || getProducts()[0];
  let view = "front",
    color = p.colors[0];
  const draw = () => {
    $("#mainView").innerHTML = jerseySVG(p, { view, color: color.hex });
  };
  draw();
  $("#pTitle").textContent = p.name;
  $("#pTeam").textContent = p.team;
  $("#pDesc").textContent = p.description;
  $("#pPrice").innerHTML = p.oldPrice
    ? `${money(p.price)}<span class="old">${money(p.oldPrice)}</span>`
    : money(p.price);
  $("#stockLbl").innerHTML =
    p.stock === 0
      ? `<span class="stock-out">✕ نفدت الكمية</span>`
      : p.stock < 5
        ? `<span class="stock-low">⚠ متبقي ${p.stock} فقط</span>`
        : `<span class="stock-ok">✓ متوفر (${p.stock})</span>`;
  $("#swatches").innerHTML = p.colors
    .map(
      (c, i) =>
        `<div class="swatch ${i === 0 ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex}"></div>`,
    )
    .join("");
  $$("#swatches .swatch").forEach(
    (s) =>
      (s.onclick = () => {
        $$("#swatches .swatch").forEach((x) => x.classList.remove("active"));
        s.classList.add("active");
        color = { hex: s.dataset.hex, name: s.dataset.name };
        draw();
      }),
  );
  $("#sizes").innerHTML = p.sizes
    .map((s) => `<button class="size">${s}</button>`)
    .join("");
  let size = null;
  $$("#sizes .size").forEach(
    (b) =>
      (b.onclick = () => {
        if (p.stock === 0) return;
        $$("#sizes .size").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        size = b.textContent;
      }),
  );
  $$(".view-tab").forEach(
    (t) =>
      (t.onclick = () => {
        view = t.dataset.view;
        $$(".view-tab").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        draw();
      }),
  );
  if (p.stock === 0) {
    $("#addBtn").disabled = true;
    $("#customBtn").style.display = "none";
  }
  $("#addBtn").onclick = async () => {
    if (!size) return toast("⚠ اختر المقاس أولاً");
    const prev = await svgToPNG(
      jerseySVG(p, { view: "front", color: color.hex }),
    );
    addToCart({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: 1,
      preview: prev,
      custom: { size, color: color.name, note: "بدون تخصيص" },
    });
  };
  $("#customBtn").href = `customizer.html?id=${p.id}`;
}

/* ---------- CUSTOMIZER (Quartier Thaïlande Wizard Style) ---------- */
function setWizardStep(step) {
  $$(".step-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.step === String(step)),
  );
  $$(".step-content").forEach((p) =>
    p.classList.toggle("active", p.dataset.stepPanel === String(step)),
  );
  if (step === 3 && window._csState) {
    window._csState.view = "back";
    if (window._csDraw) window._csDraw();
  } else if ((step === 1 || step === 4) && window._csState) {
    window._csState.view = "front";
    if (window._csDraw) window._csDraw();
  }
}

function initCustomizer() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || getProducts().find((x) => x.customizable);
  const cs = {
    size: null,
    color: p.colors[0],
    name: "",
    number: "",
    font: "bebas",
    textColor: "#f2f2f0",
    chestLogo: "default",
    sponsor: "default",
    logoColor: "#f2f2f0",
    patch: "none",
    view: "front",
  };
  window._csState = cs;
  const price = () =>
    p.price +
    (cs.name ? 400 : 0) +
    (cs.number ? 300 : 0) +
    (cs.patch !== "none" ? 500 : 0);
  const updateViewButtons = () => {
    $$("#viewToggle button").forEach((b) => {
      b.classList.toggle("active", b.dataset.v === cs.view);
    });
  };

  const draw = () => {
    $("#stage").innerHTML = jerseySVG(p, {
      view: cs.view,
      color: cs.color.hex,
      name: cs.name,
      number: cs.number,
      font: cs.font,
      textColor: cs.textColor,
      chestLogo: cs.chestLogo,
      sponsor: cs.sponsor,
      logoColor: cs.logoColor,
      patch: cs.patch,
    });
    updateReviewSpecs();
  };
  window._csDraw = draw;

  const summary = () => {
    $("#sumPrice").textContent = money(p.price);
    $("#sumExtras").textContent = money(
      (cs.name ? 400 : 0) +
        (cs.number ? 300 : 0) +
        (cs.patch !== "none" ? 500 : 0),
    );
    $("#sumTotal").textContent = money(price());
  };

  const updateReviewSpecs = () => {
    const rev = $("#reviewSpecs");
    if (!rev) return;
    const fontObj = FONTS.find((f) => f.id === cs.font) || FONTS[0];
    const patchObj = PATCHES.find((x) => x.id === cs.patch) || PATCHES[0];
    const chestObj = CHEST_LOGOS.find((x) => x.id === cs.chestLogo) || CHEST_LOGOS[0];
    const sponsorObj = SPONSORS.find((x) => x.id === cs.sponsor) || SPONSORS[0];

    rev.innerHTML = `
      <div class="spec-item"><span>القميص:</span><b>${esc(p.name)}</b></div>
      <div class="spec-item"><span>اللون:</span><b>${esc(cs.color.name)}</b></div>
      <div class="spec-item"><span>المقاس:</span><b>${cs.size ? esc(cs.size) : "<span style='color:var(--red)'>لم يتم الاختيار بعد</span>"}</b></div>
      <div class="spec-item"><span>اسم اللاعب:</span><b>${esc(cs.name || "بدون اسم")}</b></div>
      <div class="spec-item"><span>الرقم:</span><b>${esc(cs.number || "بدون رقم")}</b></div>
      <div class="spec-item"><span>نوع الخط:</span><b>${esc(fontObj.name)}</b></div>
      <div class="spec-item"><span>شعار الصدر:</span><b>${esc(chestObj.name)}</b></div>
      <div class="spec-item"><span>الراعي الرئيسي:</span><b>${esc(sponsorObj.name)}</b></div>
      <div class="spec-item"><span>رقعة الكم:</span><b>${esc(patchObj.name)}</b></div>
    `;
  };
  // Wizard steps click events
  $$(".step-btn").forEach((b) => {
    b.onclick = () => setWizardStep(b.dataset.step);
  });

  // Vertical tabs (QT style)
  $$("#qtCategoryTabs .v-tab").forEach((tb) => {
    tb.onclick = () => {
      $$("#qtCategoryTabs .v-tab").forEach((x) => x.classList.remove("active"));
      tb.classList.add("active");
      const cat = tb.dataset.cat;
      $$(".qt-panel-v .cat-content").forEach((c) =>
        c.classList.toggle("active", c.dataset.catContent === cat),
      );
    };
  });

  $("#csProduct").innerHTML = `<div class="f-row"><label>القميص — Jersey</label>
    <select class="f-select" id="selProduct">${getProducts()
      .filter((x) => x.customizable)
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(x.name)} — ${money(x.price)}</option>`,
      )
      .join("")}</select></div>`;
  $("#selProduct").onchange = (e) =>
    (location.href = "customizer.html?id=" + e.target.value);

  $("#csColors").innerHTML = p.colors
    .map(
      (c, i) =>
        `<div class="swatch ${i === 0 ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex}"></div>`,
    )
    .join("");
  $$("#csColors .swatch").forEach(
    (s) =>
      (s.onclick = () => {
        $$("#csColors .swatch").forEach((x) => x.classList.remove("active"));
        s.classList.add("active");
        cs.color = { hex: s.dataset.hex, name: s.dataset.name };
        draw();
      }),
  );

  $("#csSizes").innerHTML = p.sizes
    .map((s) => `<button class="size" data-s="${s}">${s}</button>`)
    .join("");
  $$("#csSizes .size").forEach(
    (b) =>
      (b.onclick = () => {
        $$("#csSizes .size").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        cs.size = b.dataset.s;
        draw();
      }),
  );

  $("#csFonts").innerHTML = FONTS.map(
    (f) =>
      `<button class="chip ${f.id === cs.font ? "active" : ""}" data-f="${f.id}">${f.name}</button>`,
  ).join("");
  $$("#csFonts .chip").forEach(
    (b) =>
      (b.onclick = () => {
        $$("#csFonts .chip").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        cs.font = b.dataset.f;
        draw();
      }),
  );

  $("#csTextColors").innerHTML = TEXT_COLORS.map(
    (c) =>
      `<div class="swatch ${c.hex === cs.textColor ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex};${c.hex === "#15151a" ? "outline-color:#555" : ""}"></div>`,
  ).join("");
  $$("#csTextColors .swatch").forEach(
    (s) =>
      (s.onclick = () => {
        $$("#csTextColors .swatch").forEach((x) =>
          x.classList.remove("active"),
        );
        s.classList.add("active");
        cs.textColor = s.dataset.hex;
        draw();
      }),
  );

  // Logo Chest Select
  $("#selChestLogo").innerHTML = CHEST_LOGOS.map(
    (x) => `<option value="${x.id}">${x.name}</option>`,
  ).join("");
  $("#selChestLogo").onchange = (e) => {
    cs.chestLogo = e.target.value;
    draw();
  };

  // Sponsor Select
  $("#selSponsor").innerHTML = SPONSORS.map(
    (x) => `<option value="${x.id}">${x.name}</option>`,
  ).join("");
  $("#selSponsor").onchange = (e) => {
    cs.sponsor = e.target.value;
    draw();
  };

  // Logo Colors Swatches
  $("#csLogoColors").innerHTML = TEXT_COLORS.map(
    (c, i) =>
      `<div class="swatch ${i === 0 ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex}"></div>`,
  ).join("");
  $$("#csLogoColors .swatch").forEach(
    (s) =>
      (s.onclick = () => {
        $$("#csLogoColors .swatch").forEach((x) => x.classList.remove("active"));
        s.classList.add("active");
        cs.logoColor = s.dataset.hex;
        draw();
      }),
  );

  $("#csPatches").innerHTML = PATCHES.map(
    (pt) => `<button class="chip" data-p="${pt.id}">${pt.name}</button>`,
  ).join("");
  $$("#csPatches .chip").forEach((b, i) => {
    if (i === 0) b.classList.add("active");
    b.onclick = () => {
      $$("#csPatches .chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      cs.patch = b.dataset.p;
      draw();
      summary();
    };
  });
  $("#inName").oninput = (e) => {
    cs.name = e.target.value.slice(0, 14);
    if (cs.view !== "back") {
      cs.view = "back";
      updateViewButtons();
    }
    draw();
    summary();
  };
  $("#inNumber").oninput = (e) => {
    cs.number = e.target.value.replace(/\D/g, "").slice(0, 2);
    e.target.value = cs.number;
    if (cs.view !== "back") {
      cs.view = "back";
      updateViewButtons();
    }
    draw();
    summary();
  };
  $$("#viewToggle button").forEach(
    (b) =>
      (b.onclick = () => {
        cs.view = b.dataset.v;
        $$("#viewToggle button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        draw();
      }),
  );
  draw();
  summary();
  $("#addCustom").onclick = async () => {
    if (!cs.size) return toast("⚠ اختر المقاس");
    if (p.stock === 0) return toast("✕ نفدت الكمية");
    const front = await svgToPNG(
      jerseySVG(p, { view: "front", color: cs.color.hex }),
    );
    const back = await svgToPNG(
      jerseySVG(p, {
        view: "back",
        color: cs.color.hex,
        name: cs.name,
        number: cs.number,
        font: cs.font,
        textColor: cs.textColor,
        patch: cs.patch,
      }),
    );
    const fontObj = FONTS.find((f) => f.id === cs.font) || FONTS[0];
    const patchObj = PATCHES.find((x) => x.id === cs.patch) || PATCHES[0];
    const chestObj = CHEST_LOGOS.find((x) => x.id === cs.chestLogo) || CHEST_LOGOS[0];
    const sponsorObj = SPONSORS.find((x) => x.id === cs.sponsor) || SPONSORS[0];

    addToCart({
      productId: p.id,
      name: p.name + " (مخصص)",
      price: price(),
      qty: 1,
      preview: front,
      previewBack: back,
      custom: {
        size: cs.size,
        color: cs.color.name,
        name: cs.name || "—",
        number: cs.number || "—",
        font: fontObj.name,
        chestLogo: chestObj.name,
        sponsor: sponsorObj.name,
        patch: patchObj.name,
      },
    });
  };
}
function addToCart(item) {
  const c = store.cart;
  c.push({ ...item, uid: Date.now() + Math.random() });
  store.cart = c;
  updateCartCount();
  toast("✓ تمت الإضافة إلى السلة");
}

/* ---------- CART ---------- */
function initCart() {
  renderCart();
}
function renderCart() {
  const c = store.cart,
    box = $("#cartBox");
  if (!c.length) {
    box.innerHTML = `<div class="empty-state"><div class="big">السلة فارغة</div><p>لم تقم بإضافة أي قميص بعد — صمّم قميصك الخاص الآن ✦</p><br><a class="btn btn-red" href="customizer.html">ابدأ التخصيص</a></div>`;
    $("#cartSide").style.display = "none";
    return;
  }
  box.innerHTML = c
    .map(
      (i, idx) => `<div class="cart-item">
    <div class="cart-thumb"><img src="${i.preview}" alt=""></div>
    <div><h4>${esc(i.name)}</h4>
      <div class="cart-specs">${Object.entries(i.custom || {})
        .map(([k, v]) => `<b>${k}:</b> ${esc(v)}`)
        .join(" · ")}</div>
      <div style="font-weight:800;color:var(--gold)">${money(i.price)}</div></div>
    <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-end">
      <div class="qty"><button onclick="chQty(${idx},-1)">−</button><span>${i.qty}</span><button onclick="chQty(${idx},1)">+</button></div>
      <button class="btn btn-outline btn-sm" onclick="rmItem(${idx})">حذف ✕</button></div></div>`,
    )
    .join("");
  const sub = c.reduce((a, i) => a + i.price * i.qty, 0);
  const del = sub >= FREE_OVER ? 0 : DELIVERY_FEE;
  $("#cSub").textContent = money(sub);
  $("#cDel").textContent = del ? money(del) : "مجاني 🎉";
  $("#cTotal").textContent = money(sub + del);
}
function chQty(i, d) {
  const c = store.cart;
  c[i].qty = Math.max(1, c[i].qty + d);
  store.cart = c;
  renderCart();
  updateCartCount();
}
function rmItem(i) {
  const c = store.cart;
  c.splice(i, 1);
  store.cart = c;
  renderCart();
  updateCartCount();
  toast("تم الحذف من السلة");
}

/* ---------- CHECKOUT ---------- */
function initCheckout() {
  const c = store.cart;
  if (!c.length) {
    $("#coForm").innerHTML =
      `<div class="empty-state"><div class="big">لا يوجد طلب</div><p>أضف منتجات إلى السلة أولاً.</p><br><a class="btn btn-red" href="shop.html">تصفح المتجر</a></div>`;
    $("#coSide").style.display = "none";
    return;
  }
  $("#wilaya").innerHTML = WILAYAS.map((w) => `<option>${w}</option>`).join("");
  const sub = c.reduce((a, i) => a + i.price * i.qty, 0),
    del = sub >= FREE_OVER ? 0 : DELIVERY_FEE,
    total = sub + del;
  $("#coItems").innerHTML = c
    .map(
      (i) =>
        `<div class="checkout-item"><img src="${i.preview}"><div><div class="n">${esc(i.name)} ×${i.qty}</div><div class="s">${Object.entries(
          i.custom || {},
        )
          .map(([k, v]) => `${k}: ${esc(v)}`)
          .join(
            " · ",
          )}</div></div><div class="p">${money(i.price * i.qty)}</div></div>`,
    )
    .join("");
  $("#coSub").textContent = money(sub);
  $("#coDel").textContent = del ? money(del) : "مجاني";
  $("#coTotal").textContent = money(total);
  $("#coForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const order = {
      id: "IL-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toLocaleString("fr-DZ"),
      customer: {
        name: f.get("name"),
        phone: f.get("phone"),
        wilaya: f.get("wilaya"),
        address: f.get("address"),
        notes: f.get("notes") || "—",
      },
      items: c,
      subtotal: sub,
      delivery: del,
      total,
      status: "New",
    };
    const o = store.orders;
    o.unshift(order);
    store.orders = o;
    store.cart = [];
    location.href = "confirmation.html?id=" + order.id;
  };
}
function initConfirmation() {
  const id = new URLSearchParams(location.search).get("id");
  const o = store.orders.find((x) => x.id === id);
  if (!o) return;
  $("#oid").textContent = o.id;
  $("#oconf").innerHTML = `
    <div class="order-detail">
      <div class="od-row"><span>الاسم</span><b>${esc(o.customer.name)}</b></div>
      <div class="od-row"><span>الهاتف</span><b>${esc(o.customer.phone)}</b></div>
      <div class="od-row"><span>الولاية</span><b>${esc(o.customer.wilaya)}</b></div>
      <div class="od-row"><span>العنوان</span><b>${esc(o.customer.address)}</b></div>
      <div class="od-row"><span>التوصيل</span><b>${o.delivery ? money(o.delivery) : "مجاني"}</b></div>
      <div class="od-row"><span><b>الإجمالي (دفع عند الاستلام)</b></span><b style="color:var(--gold)">${money(o.total)}</b></div>
    </div>
    <div class="order-items-mini">${o.items
      .map(
        (i) =>
          `<div class="oi"><img src="${i.preview}"><div><b>${esc(i.name)} ×${i.qty}</b><div class="d">${Object.entries(
            i.custom || {},
          )
            .map(([k, v]) => `${k}: <b>${esc(v)}</b>`)
            .join(" · ")}</div></div></div>`,
      )
      .join("")}</div>`;
}
function initContact() {
  const f = $("#contactForm");
  if (f)
    f.onsubmit = (e) => {
      e.preventDefault();
      f.innerHTML = `<div class="success-box" style="margin:0;padding:32px"><div class="success-icon" style="width:56px;height:56px;font-size:26px">✓</div><h3 style="font-size:24px">تم استلام رسالتك</h3><p style="color:var(--grey);margin-top:8px">سنرد عليك في أقرب وقت.</p></div>`;
    };
}

/* ---------- ADMIN ---------- */
function initAdmin() {
  if (sessionStorage.getItem("il_admin") !== "1") {
    $("#login").style.display = "block";
    $("#dash").style.display = "none";
    $("#loginForm").onsubmit = (e) => {
      e.preventDefault();
      if ($("#pass").value === ADMIN_PASS) {
        sessionStorage.setItem("il_admin", "1");
        initAdmin();
      } else toast("✕ كلمة مرور خاطئة");
    };
    return;
  }
  $("#login").style.display = "none";
  $("#dash").style.display = "block";
  let tab = "orders";
  const draw = () => {
    const ps = getProducts(),
      os = store.orders;
    $("#stats").innerHTML = `
      <div class="stat-card"><div class="v">${os.length}</div><div class="l">Orders</div></div>
      <div class="stat-card"><div class="v">${os.filter((o) => o.status === "New").length}</div><div class="l">New Orders</div></div>
      <div class="stat-card"><div class="v">${ps.length}</div><div class="l">Products</div></div>
      <div class="stat-card"><div class="v">${money(os.filter((o) => o.status !== "Cancelled").reduce((a, o) => a + o.total, 0))}</div><div class="l">Revenue</div></div>`;
    $$(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.t === tab),
    );
    const body = $("#adminBody");
    if (tab === "orders") {
      body.innerHTML = `<div class="table-card"><table><thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
      ${
        os.length
          ? os
              .map(
                (
                  o,
                  i,
                ) => `<tr><td><b>${o.id}</b><br><span style="color:var(--grey);font-size:11px">${o.date}</span></td>
        <td>${esc(o.customer.name)}<br><span style="color:var(--grey);font-size:11px">${esc(o.customer.wilaya)}</span></td>
        <td>${esc(o.customer.phone)}</td><td><b style="color:var(--gold)">${money(o.total)}</b></td>
        <td><span class="status st-${o.status}">${o.status}</span></td>
        <td><button class="btn btn-dark btn-sm" onclick="viewOrder(${i})">View</button></td></tr>`,
              )
              .join("")
          : `<tr><td colspan="6" style="text-align:center;color:var(--grey)">لا توجد طلبات بعد</td></tr>`
      }</tbody></table></div>`;
    } else {
      body.innerHTML = `<div style="margin-bottom:16px"><button class="btn btn-red btn-sm" onclick="editProduct(null)">+ Add Product</button></div>
      <div class="table-card"><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Colors</th><th>Custom</th><th></th></tr></thead><tbody>
      ${ps
        .map(
          (
            p,
          ) => `<tr><td><b>${esc(p.name)}</b><br><span style="color:var(--grey);font-size:11px">${esc(p.team)}</span></td>
        <td><b style="color:var(--gold)">${money(p.price)}</b></td><td>${p.stock === 0 ? '<span class="stock-out">Out</span>' : p.stock}</td>
        <td>${p.colors.map((c) => `<span class="dot" style="background:${c.hex};display:inline-block;margin-right:4px"></span>`).join("")}</td>
        <td>${p.customizable ? '<span class="badge-soft gold">Yes</span>' : '<span class="badge-soft">No</span>'}</td>
        <td style="white-space:nowrap"><button class="btn btn-dark btn-sm" onclick="editProduct('${p.id}')">Edit</button> <button class="btn btn-outline btn-sm" onclick="delProduct('${p.id}')">Delete</button></td></tr>`,
        )
        .join("")}</tbody></table></div>`;
    }
  };
  $$(".tab").forEach(
    (t) =>
      (t.onclick = () => {
        tab = t.dataset.t;
        draw();
      }),
  );
  $("#logout").onclick = () => {
    sessionStorage.removeItem("il_admin");
    initAdmin();
  };
  draw();
}
function viewOrder(i) {
  const o = store.orders[i];
  const sel = [
    "New",
    "Confirmed",
    "Preparing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]
    .map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`)
    .join("");
  openModal(`<button class="modal-close" onclick="closeModal()">✕</button><h3>Order ${o.id}</h3>
    <div class="order-detail">
      <div class="od-row"><span>Customer</span><b>${esc(o.customer.name)}</b></div>
      <div class="od-row"><span>Phone</span><b>${esc(o.customer.phone)}</b></div>
      <div class="od-row"><span>Wilaya</span><b>${esc(o.customer.wilaya)}</b></div>
      <div class="od-row"><span>Address</span><b>${esc(o.customer.address)}</b></div>
      <div class="od-row"><span>Notes</span><b>${esc(o.customer.notes)}</b></div>
      <div class="od-row"><span>Date</span><b>${o.date}</b></div>
    </div>
    <h4 style="margin:14px 0 8px;color:var(--gold)">ITEMS & CUSTOMIZATION</h4>
    <div class="order-items-mini">${o.items
      .map(
        (
          it,
        ) => `<div class="oi"><img src="${it.preview}">${it.previewBack ? `<img src="${it.previewBack}">` : ""}<div><b>${esc(it.name)} ×${it.qty}</b> — <b style="color:var(--gold)">${money(it.price * it.qty)}</b>
      <div class="d">${Object.entries(it.custom || {})
        .map(([k, v]) => `${k}: <b>${esc(v)}</b>`)
        .join(" · ")}</div></div></div>`,
      )
      .join("")}</div>
    <div class="order-detail" style="margin-top:14px">
      <div class="od-row"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>
      <div class="od-row"><span>Delivery</span><b>${o.delivery ? money(o.delivery) : "Free"}</b></div>
      <div class="od-row"><span><b>Total (COD)</b></span><b style="color:var(--gold)">${money(o.total)}</b></div>
    </div>
    <div class="f-row"><label>Order Status</label><select class="f-select" onchange="setStatus(${i},this.value)">${sel}</select></div>`);
}
function setStatus(i, s) {
  const o = store.orders;
  o[i].status = s;
  store.orders = o;
  toast("✓ Status → " + s);
  initAdmin();
  closeModal();
}
function delProduct(id) {
  if (!confirm("حذف هذا المنتج نهائياً؟")) return;
  store.products = store.products.filter((p) => p.id !== id);
  toast("تم الحذف");
  initAdmin();
}
function editProduct(id) {
  const p = id
    ? getProduct(id)
    : {
        id: "",
        name: "",
        team: "",
        price: 4000,
        stock: 10,
        customizable: true,
        colors: [{ name: "White", hex: "#f2f2f0" }],
        sizes: ["S", "M", "L", "XL"],
        description: "",
        pattern: "plain",
        badge: "",
      };
  openModal(`<button class="modal-close" onclick="closeModal()">✕</button><h3>${id ? "Edit" : "Add"} Product</h3>
   <form onsubmit="saveProduct(event,'${id || ""}')">
    <div class="f-grid2"><div class="f-row"><label>Name</label><input class="f-input" name="name" required value="${esc(p.name)}"></div>
    <div class="f-row"><label>Team</label><input class="f-input" name="team" required value="${esc(p.team)}"></div></div>
    <div class="f-grid2"><div class="f-row"><label>Price (DA)</label><input class="f-input" type="number" name="price" required value="${p.price}"></div>
    <div class="f-row"><label>Stock</label><input class="f-input" type="number" name="stock" required value="${p.stock}"></div></div>
    <div class="f-grid2"><div class="f-row"><label>Sizes (comma)</label><input class="f-input" name="sizes" value="${p.sizes.join(",")}"></div>
    <div class="f-row"><label>Pattern</label><select class="f-select" name="pattern">${["plain", "stripes", "blaugrana", "retro"].map((x) => `<option ${x === p.pattern ? "selected" : ""}>${x}</option>`).join("")}</select></div></div>
    <div class="f-row"><label>Colors (name:hex, comma)</label><input class="f-input" name="colors" value="${p.colors.map((c) => c.name + ":" + c.hex).join(",")}" placeholder="White:#f2f2f0, Black:#15151a"></div>
    <div class="f-row"><label>Description</label><textarea class="f-textarea" name="description" rows="3">${esc(p.description)}</textarea></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:18px"><input type="checkbox" name="customizable" ${p.customizable ? "checked" : ""}> Customizable (Live Designer)</label>
    <button class="btn btn-red btn-block">${id ? "Save Changes" : "Add Product"}</button></form>`);
}
function saveProduct(e, id) {
  e.preventDefault();
  const f = new FormData(e.target);
  const colors = String(f.get("colors"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [name, hex] = s.split(":");
      return { name: name.trim(), hex: (hex || "#999").trim() };
    });
  const p = {
    id: id || "p-" + Date.now().toString(36),
    name: f.get("name"),
    team: f.get("team"),
    price: +f.get("price"),
    stock: +f.get("stock"),
    sizes: String(f.get("sizes"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    colors,
    pattern: f.get("pattern"),
    description: f.get("description"),
    customizable: !!f.get("customizable"),
    badge: getProduct(id)?.badge || null,
    oldPrice: getProduct(id)?.oldPrice || null,
  };
  const ps = store.products;
  const i = ps.findIndex((x) => x.id === id);
  if (i > -1) ps[i] = p;
  else ps.push(p);
  store.products = ps;
  closeModal();
  toast("✓ Product saved");
  initAdmin();
}
function openModal(html) {
  let m = $("#modalBg");
  if (!m) {
    m = document.createElement("div");
    m.id = "modalBg";
    m.className = "modal-bg";
    m.innerHTML = `<div class="modal" id="modalBox"></div>`;
    m.onclick = (e) => {
      if (e.target === m) closeModal();
    };
    document.body.appendChild(m);
  }
  $("#modalBox").innerHTML = html;
  m.classList.add("open");
}
function closeModal() {
  const m = $("#modalBg");
  if (m) m.classList.remove("open");
}
