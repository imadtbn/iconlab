/* ============ PAGE CONTROLLERS ============ */
document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  if (window.IconLabDB) await window.IconLabDB.init();
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

async function initCustomizer() {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || getProducts().find((x) => x.customizable);
  const draftKey = "il_customizer_draft_" + p.id;
  const baseTransforms = {
    name: { x: 0, y: 0, scale: 1, rotation: 0 },
    number: { x: 0, y: 0, scale: 1, rotation: 0 },
    crest: { x: 0, y: 0, scale: 1, rotation: 0 },
    brand: { x: 0, y: 0, scale: 1, rotation: 0 },
    sponsor: { x: 0, y: 0, scale: 1, rotation: 0 },
    patch: { x: 0, y: 0, scale: 1, rotation: 0 },
  };

  try {
    await loadDesignAssets();
  } catch (error) {
    console.warn("[IconLab] Some real assets could not be loaded.", error);
  }

  let savedDraft = null;
  try {
    savedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
  } catch (_) {}

  const cs = {
    size: savedDraft?.size || null,
    color: savedDraft?.color || p.colors[0],
    name: savedDraft?.name || "",
    number: savedDraft?.number || "",
    font: savedDraft?.font || "bebas",
    textColor: savedDraft?.textColor || "#f2f2f0",
    chestLogo: savedDraft?.chestLogo || getDefaultCrestForProduct(p),
    brand: savedDraft?.brand || "nike",
    sponsor: savedDraft?.sponsor || "default",
    logoColor: savedDraft?.logoColor || "#f2f2f0",
    patch: savedDraft?.patch || "none",
    view: savedDraft?.view || "front",
    activeLayer: savedDraft?.activeLayer || "name",
    transforms: {
      ...structuredClone(baseTransforms),
      ...(savedDraft?.transforms || {}),
    },
  };
  window._csState = cs;

  let history = [JSON.stringify(cs.transforms)];
  let historyIndex = 0;
  let isDraggingLayer = false;

  const layerMeta = {
    name: { label: "طبقة الاسم", view: "back" },
    number: { label: "طبقة الرقم", view: "back" },
    crest: { label: "شعار الصدر", view: "front" },
    brand: { label: "الماركة", view: "front" },
    sponsor: { label: "الراعي", view: "front" },
    patch: { label: "رقعة الكم", view: "front" },
  };

  const persistDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify({
      size: cs.size,
      color: cs.color,
      name: cs.name,
      number: cs.number,
      font: cs.font,
      textColor: cs.textColor,
      chestLogo: cs.chestLogo,
      brand: cs.brand,
      sponsor: cs.sponsor,
      logoColor: cs.logoColor,
      patch: cs.patch,
      view: cs.view,
      activeLayer: cs.activeLayer,
      transforms: cs.transforms,
    }));
  };

  const commitHistory = () => {
    const snapshot = JSON.stringify(cs.transforms);
    if (history[historyIndex] === snapshot) {
      persistDraft();
      return;
    }
    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    if (history.length > 40) history.shift();
    historyIndex = history.length - 1;
    persistDraft();
    updateHistoryButtons();
  };

  const updateHistoryButtons = () => {
    if ($("#undoDesign")) $("#undoDesign").disabled = historyIndex <= 0;
    if ($("#redoDesign")) $("#redoDesign").disabled = historyIndex >= history.length - 1;
  };

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

  const updateLayerUI = () => {
    $$("#studioLayerTabs button").forEach((b) =>
      b.classList.toggle("active", b.dataset.layer === cs.activeLayer),
    );
    if ($("#activeLayerLabel")) {
      $("#activeLayerLabel").textContent = layerMeta[cs.activeLayer]?.label || "طبقة";
    }
  };

  const selectLayer = (layer) => {
    if (!layerMeta[layer]) return;
    cs.activeLayer = layer;
    cs.view = layerMeta[layer].view;
    updateViewButtons();
    updateLayerUI();
    persistDraft();
    draw();
  };

  const bindLayerDrag = () => {
    const svg = $("#stage svg");
    if (!svg) return;

    svg.querySelectorAll("[data-layer]").forEach((node) => {
      const layer = node.dataset.layer;
      node.classList.toggle("studio-selected", layer === cs.activeLayer);

      node.onpointerdown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectLayer(layer);

        const startX = event.clientX;
        const startY = event.clientY;
        const rect = svg.getBoundingClientRect();
        const startTransform = { ...cs.transforms[layer] };
        isDraggingLayer = true;
        svg.setPointerCapture?.(event.pointerId);

        const move = (ev) => {
          if (!isDraggingLayer) return;
          const dx = (ev.clientX - startX) * (400 / Math.max(rect.width, 1));
          const dy = (ev.clientY - startY) * (500 / Math.max(rect.height, 1));
          cs.transforms[layer] = {
            ...startTransform,
            x: Math.max(-110, Math.min(110, startTransform.x + dx)),
            y: Math.max(-140, Math.min(140, startTransform.y + dy)),
          };
          draw(false);
        };

        const stop = () => {
          if (!isDraggingLayer) return;
          isDraggingLayer = false;
          svg.onpointermove = null;
          svg.onpointerup = null;
          svg.onpointercancel = null;
          commitHistory();
        };

        svg.onpointermove = move;
        svg.onpointerup = stop;
        svg.onpointercancel = stop;
      };
    });
  };

  const updateReviewSpecs = () => {
    const rev = $("#reviewSpecs");
    if (!rev) return;
    const fontObj = FONTS.find((f) => f.id === cs.font) || FONTS[0];
    const patchObj = PATCHES.find((x) => x.id === cs.patch) || PATCHES[0];
    const chestObj = CHEST_LOGOS.find((x) => x.id === cs.chestLogo) || CHEST_LOGOS[0];
    const sponsorObj = SPONSORS.find((x) => x.id === cs.sponsor) || SPONSORS[0];
    const brandObj = BRANDS.find((x) => x.id === cs.brand) || BRANDS[0];

    rev.innerHTML = `
      <div class="spec-item"><span>القميص:</span><b>${esc(p.name)}</b></div>
      <div class="spec-item"><span>اللون:</span><b>${esc(cs.color.name)}</b></div>
      <div class="spec-item"><span>المقاس:</span><b>${cs.size ? esc(cs.size) : "<span style='color:var(--red)'>لم يتم الاختيار بعد</span>"}</b></div>
      <div class="spec-item"><span>اسم اللاعب:</span><b>${esc(cs.name || "بدون اسم")}</b></div>
      <div class="spec-item"><span>الرقم:</span><b>${esc(cs.number || "بدون رقم")}</b></div>
      <div class="spec-item"><span>نوع الخط:</span><b>${esc(fontObj.name)}</b></div>
      <div class="spec-item"><span>شعار الصدر:</span><b>${esc(chestObj.name)}</b></div>
      <div class="spec-item"><span>الماركة:</span><b>${esc(brandObj.name)}</b></div>
      <div class="spec-item"><span>الراعي الرئيسي:</span><b>${esc(sponsorObj.name)}</b></div>
      <div class="spec-item"><span>رقعة الكم:</span><b>${esc(patchObj.name)}</b></div>
    `;
  };

  const draw = (bindDrag = true) => {
    $("#stage").innerHTML = jerseySVG(p, {
      view: cs.view,
      color: cs.color.hex,
      name: cs.name,
      number: cs.number,
      font: cs.font,
      textColor: cs.textColor,
      chestLogo: cs.chestLogo,
      brand: cs.brand,
      sponsor: cs.sponsor,
      logoColor: cs.logoColor,
      patch: cs.patch,
      transforms: cs.transforms,
    });
    updateViewButtons();
    updateLayerUI();
    updateReviewSpecs();
    if (bindDrag) requestAnimationFrame(bindLayerDrag);
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

  const mutateActiveLayer = (mutator) => {
    const layer = cs.activeLayer;
    if (!cs.transforms[layer]) return;
    mutator(cs.transforms[layer]);
    cs.transforms[layer].scale = Math.max(0.45, Math.min(2.2, cs.transforms[layer].scale));
    cs.transforms[layer].rotation = Math.max(-180, Math.min(180, cs.transforms[layer].rotation));
    commitHistory();
    draw();
  };

  $$(".step-btn").forEach((b) => {
    b.onclick = () => setWizardStep(b.dataset.step);
  });

  $$("#qtCategoryTabs .v-tab").forEach((tb) => {
    tb.onclick = () => {
      $$("#qtCategoryTabs .v-tab").forEach((x) => x.classList.remove("active"));
      tb.classList.add("active");
      const cat = tb.dataset.cat;
      $$(".qt-panel-v .cat-content").forEach((panel) =>
        panel.classList.toggle("active", panel.dataset.catContent === cat),
      );
    };
  });

  $("#csProduct").innerHTML = `<div class="f-row"><label>القميص — Jersey</label>
    <select class="f-select" id="selProduct">${getProducts()
      .filter((x) => x.customizable)
      .map((x) =>
        `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(x.name)} — ${money(x.price)}</option>`
      ).join("")}</select></div>`;
  $("#selProduct").onchange = (e) =>
    (location.href = "customizer.html?id=" + e.target.value);

  $("#csColors").innerHTML = p.colors
    .map((c, i) =>
      `<div class="swatch ${i === 0 ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex}"></div>`
    ).join("");
  $$("#csColors .swatch").forEach((s) => {
    if (s.dataset.hex === cs.color.hex) {
      $$("#csColors .swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
    }
    s.onclick = () => {
      $$("#csColors .swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      cs.color = { hex: s.dataset.hex, name: s.dataset.name };
      persistDraft();
      draw();
    };
  });

  $("#csSizes").innerHTML = p.sizes
    .map((s) => `<button class="size ${s === cs.size ? "active" : ""}" data-s="${s}">${s}</button>`)
    .join("");
  $$("#csSizes .size").forEach((b) => {
    b.onclick = () => {
      $$("#csSizes .size").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      cs.size = b.dataset.s;
      persistDraft();
      draw();
    };
  });

  $("#csFonts").innerHTML = FONTS.map((f) =>
    `<button class="chip ${f.id === cs.font ? "active" : ""}" data-f="${f.id}">${f.name}</button>`
  ).join("");
  $$("#csFonts .chip").forEach((b) => {
    b.onclick = () => {
      $$("#csFonts .chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      cs.font = b.dataset.f;
      persistDraft();
      draw();
    };
  });

  $("#csTextColors").innerHTML = TEXT_COLORS.map((c) =>
    `<div class="swatch ${c.hex === cs.textColor ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex};${c.hex === "#15151a" ? "outline-color:#555" : ""}"></div>`
  ).join("");
  $$("#csTextColors .swatch").forEach((s) => {
    s.onclick = () => {
      $$("#csTextColors .swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      cs.textColor = s.dataset.hex;
      persistDraft();
      draw();
    };
  });

  $("#selChestLogo").innerHTML = CHEST_LOGOS.map((x) =>
    `<option value="${x.id}" ${x.id === cs.chestLogo ? "selected" : ""}>${x.name}</option>`
  ).join("");
  $("#selChestLogo").onchange = (e) => {
    cs.chestLogo = e.target.value;
    persistDraft();
    selectLayer("crest");
  };

  $("#selBrand").innerHTML = BRANDS.map((x) =>
    `<option value="${x.id}" ${x.id === cs.brand ? "selected" : ""}>${x.name}</option>`
  ).join("");
  $("#selBrand").onchange = (e) => {
    cs.brand = e.target.value;
    persistDraft();
    selectLayer("brand");
  };

  $("#selSponsor").innerHTML = SPONSORS.map((x) =>
    `<option value="${x.id}" ${x.id === cs.sponsor ? "selected" : ""}>${x.name}</option>`
  ).join("");
  $("#selSponsor").onchange = (e) => {
    cs.sponsor = e.target.value;
    persistDraft();
    selectLayer("sponsor");
  };

  $("#csLogoColors").innerHTML = TEXT_COLORS.map((c) =>
    `<div class="swatch ${c.hex === cs.logoColor ? "active" : ""}" data-hex="${c.hex}" data-name="${c.name}" title="${c.name}" style="background:${c.hex}"></div>`
  ).join("");
  $$("#csLogoColors .swatch").forEach((s) => {
    s.onclick = () => {
      $$("#csLogoColors .swatch").forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      cs.logoColor = s.dataset.hex;
      persistDraft();
      draw();
    };
  });

  $("#csPatches").innerHTML = PATCHES.map((pt) =>
    `<button class="chip ${pt.id === cs.patch ? "active" : ""}" data-p="${pt.id}">${pt.name}</button>`
  ).join("");
  $$("#csPatches .chip").forEach((b) => {
    b.onclick = () => {
      $$("#csPatches .chip").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      cs.patch = b.dataset.p;
      persistDraft();
      selectLayer("patch");
      summary();
    };
  });

  $("#inName").value = cs.name;
  $("#inName").oninput = (e) => {
    cs.name = e.target.value.slice(0, 14);
    cs.view = "back";
    cs.activeLayer = "name";
    persistDraft();
    draw();
    summary();
  };

  $("#inNumber").value = cs.number;
  $("#inNumber").oninput = (e) => {
    cs.number = e.target.value.replace(/\D/g, "").slice(0, 2);
    e.target.value = cs.number;
    cs.view = "back";
    cs.activeLayer = "number";
    persistDraft();
    draw();
    summary();
  };

  $$("#viewToggle button").forEach((b) => {
    b.onclick = () => {
      cs.view = b.dataset.v;
      persistDraft();
      draw();
    };
  });

  $$("#studioLayerTabs button").forEach((b) => {
    b.onclick = () => selectLayer(b.dataset.layer);
  });

  $$("#studioToolbar [data-move]").forEach((b) => {
    b.onclick = () => {
      const [dx, dy] = b.dataset.move.split(",").map(Number);
      mutateActiveLayer((t) => {
        t.x = Math.max(-110, Math.min(110, t.x + dx));
        t.y = Math.max(-140, Math.min(140, t.y + dy));
      });
    };
  });

  $$("#studioToolbar [data-scale]").forEach((b) => {
    b.onclick = () => mutateActiveLayer((t) => {
      t.scale = Number((t.scale + Number(b.dataset.scale)).toFixed(2));
    });
  });

  $$("#studioToolbar [data-rotate]").forEach((b) => {
    b.onclick = () => mutateActiveLayer((t) => {
      t.rotation += Number(b.dataset.rotate);
    });
  });

  $("#undoDesign").onclick = () => {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    cs.transforms = JSON.parse(history[historyIndex]);
    persistDraft();
    updateHistoryButtons();
    draw();
  };

  $("#redoDesign").onclick = () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    cs.transforms = JSON.parse(history[historyIndex]);
    persistDraft();
    updateHistoryButtons();
    draw();
  };

  $("#resetDesign").onclick = () => {
    cs.transforms = structuredClone(baseTransforms);
    commitHistory();
    draw();
    toast("تمت إعادة ضبط مواضع التصميم");
  };

  const generateDesignRenders = async () => {
    const front = await svgToPNG(jerseySVG(p, {
      view: "front",
      color: cs.color.hex,
      chestLogo: cs.chestLogo,
      brand: cs.brand,
      sponsor: cs.sponsor,
      logoColor: cs.logoColor,
      patch: cs.patch,
      transforms: cs.transforms,
    }), 720, 900);
    const back = await svgToPNG(jerseySVG(p, {
      view: "back",
      color: cs.color.hex,
      name: cs.name,
      number: cs.number,
      font: cs.font,
      textColor: cs.textColor,
      patch: cs.patch,
      transforms: cs.transforms,
    }), 720, 900);
    return { front, back };
  };

  const buildDesignPdfBlob = async () => {
    if (!window.jspdf?.jsPDF) throw new Error("JSPDF_NOT_READY");
    const { front, back } = await generateDesignRenders();
    const designId = localStorage.getItem("il_last_design_id") ||
      ("IL-DGN-" + Date.now().toString(36).toUpperCase());
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFillColor(14, 14, 16);
    doc.rect(0, 0, 297, 210, "F");
    doc.setTextColor(242, 242, 240);
    doc.setFontSize(19);
    doc.text("ICONLAB - JERSEY DESIGN SHEET", 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(190, 190, 190);
    doc.text("Design ID: " + designId, 14, 23);
    doc.text("Product: " + String(p.name || ""), 14, 29);
    doc.text("Size: " + String(cs.size || "-") + "   Color: " + String(cs.color?.name || "-"), 14, 35);
    doc.text("Name: " + String(cs.name || "-") + "   Number: " + String(cs.number || "-"), 14, 41);

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(12);
    doc.text("FRONT", 80, 22, { align: "center" });
    doc.text("BACK", 217, 22, { align: "center" });

    doc.addImage(front, "PNG", 24, 28, 112, 150);
    doc.addImage(back, "PNG", 161, 28, 112, 150);

    doc.setDrawColor(70, 70, 76);
    doc.line(148.5, 28, 148.5, 184);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("Generated by IconLab Design Studio", 14, 199);
    return { blob: doc.output("blob"), designId, front, back };
  };

  $("#exportDesignPdf").onclick = async () => {
    const btn = $("#exportDesignPdf");
    btn.disabled = true;
    btn.textContent = "جاري إنشاء PDF...";
    try {
      const { blob, designId } = await buildDesignPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = designId + "-iconlab.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast("✓ تم تصدير PDF");
    } catch (error) {
      console.error(error);
      toast("تعذر إنشاء ملف PDF");
    } finally {
      btn.disabled = false;
      btn.textContent = "تصدير PDF";
    }
  };

  $("#shareDesign").onclick = async () => {
    const btn = $("#shareDesign");
    btn.disabled = true;
    btn.textContent = "جاري تجهيز المشاركة...";
    try {
      const { blob, designId } = await buildDesignPdfBlob();
      const file = new File([blob], designId + "-iconlab.pdf", { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: "IconLab Jersey Design",
          text: "Design " + designId,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast("المشاركة غير مدعومة؛ تم تنزيل ملف PDF");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        toast("تعذر مشاركة التصميم");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "مشاركة التصميم";
    }
  };

  $("#saveDesignDraft").onclick = async () => {
    const btn = $("#saveDesignDraft");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";
    try {
      const { front, back } = await generateDesignRenders();
      const designId = "IL-DGN-" + Date.now().toString(36).toUpperCase();
      const design = {
        id: designId,
        productId: p.id,
        createdAt: new Date().toISOString(),
        size: cs.size,
        color: cs.color,
        name: cs.name,
        number: cs.number,
        font: cs.font,
        textColor: cs.textColor,
        chestLogo: cs.chestLogo,
        brand: cs.brand,
        sponsor: cs.sponsor,
        logoColor: cs.logoColor,
        patch: cs.patch,
        transforms: cs.transforms,
        previewFront: front,
        previewBack: back,
      };
      if (window.IconLabDB) await window.IconLabDB.createDesign(design);
      localStorage.setItem("il_last_design_id", designId);
      toast("✓ تم حفظ التصميم " + designId);
    } catch (error) {
      console.error(error);
      toast("تعذر حفظ التصميم");
    } finally {
      btn.disabled = false;
      btn.textContent = "حفظ التصميم";
    }
  };

  draw();
  summary();
  updateHistoryButtons();

  $("#addCustom").onclick = async () => {
    if (!cs.size) return toast("⚠ اختر المقاس");
    if (p.stock === 0) return toast("✕ نفدت الكمية");

    const { front, back } = await generateDesignRenders();

    const fontObj = FONTS.find((f) => f.id === cs.font) || FONTS[0];
    const patchObj = PATCHES.find((x) => x.id === cs.patch) || PATCHES[0];
    const chestObj = CHEST_LOGOS.find((x) => x.id === cs.chestLogo) || CHEST_LOGOS[0];
    const sponsorObj = SPONSORS.find((x) => x.id === cs.sponsor) || SPONSORS[0];
    const brandObj = BRANDS.find((x) => x.id === cs.brand) || BRANDS[0];

    const designId = "IL-DGN-" + Date.now().toString(36).toUpperCase();
    const design = {
      id: designId,
      productId: p.id,
      createdAt: new Date().toISOString(),
      size: cs.size,
      color: cs.color,
      name: cs.name,
      number: cs.number,
      font: cs.font,
      textColor: cs.textColor,
      chestLogo: cs.chestLogo,
      sponsor: cs.sponsor,
      logoColor: cs.logoColor,
      patch: cs.patch,
      transforms: cs.transforms,
      previewFront: front,
      previewBack: back,
    };

    try {
      if (window.IconLabDB) await window.IconLabDB.createDesign(design);
    } catch (error) {
      console.warn("[IconLab] Design kept locally; remote save failed.", error);
    }

    addToCart({
      productId: p.id,
      designId,
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
        brand: brandObj.name,
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
  $("#cSub").textContent = money(sub);
  $("#cDel").textContent = "يُحدد عند الإتمام";
  $("#cTotal").textContent = money(sub);
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

  const companies = getDeliveryCompanies();
  if (!companies.length) {
    $("#coForm").innerHTML =
      `<div class="empty-state"><div class="big">التوصيل غير متاح حالياً</div><p>لم يتم تفعيل أي شركة توصيل من إعدادات المتجر.</p></div>`;
    $("#coSide").style.display = "none";
    return;
  }

  $("#deliveryCompany").innerHTML = companies
    .map((company, index) =>
      `<option value="${company.id}" ${index === 0 ? "selected" : ""}>${esc(company.name)} — ${money(company.price)}</option>`
    )
    .join("");

  const sub = c.reduce((a, i) => a + i.price * i.qty, 0);
  let selectedCompany = companies[0];

  const renderTotals = () => {
    const delivery = Number(selectedCompany?.price || 0);
    $("#coSub").textContent = money(sub);
    $("#coDel").textContent = money(delivery);
    $("#coTotal").textContent = money(sub + delivery);
    $("#deliveryPrice").textContent = money(delivery);
  };

  $("#deliveryCompany").onchange = (e) => {
    selectedCompany = getDeliveryCompany(e.target.value) || companies[0];
    renderTotals();
  };

  $("#coItems").innerHTML = c
    .map(
      (i) =>
        `<div class="checkout-item"><img src="${i.preview}" alt=""><div><div class="n">${esc(i.name)} ×${i.qty}</div><div class="s">${Object.entries(
          i.custom || {},
        )
          .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
          .join(" · ")}</div></div><div class="p">${money(i.price * i.qty)}</div></div>`,
    )
    .join("");

  renderTotals();

  $("#coForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    selectedCompany = getDeliveryCompany(f.get("deliveryCompany"));
    if (!selectedCompany) return toast("اختر شركة التوصيل");

    const delivery = Number(selectedCompany.price || 0);
    const total = sub + delivery;

    const order = {
      id: "IL-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toLocaleString("fr-DZ"),
      customer: {
        name: String(f.get("name") || "").trim(),
        phone: String(f.get("phone") || "").trim(),
        wilaya: String(f.get("wilaya") || "").trim(),
        commune: String(f.get("commune") || "").trim(),
        address: String(f.get("address") || "").trim(),
        notes: String(f.get("notes") || "").trim() || "—",
      },
      shipping: {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        price: delivery,
      },
      items: c,
      subtotal: sub,
      delivery,
      total,
      status: "New",
    };

    const submitBtn = e.target.querySelector('button[type="submit"], button:not([type])');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "جاري تسجيل الطلب...";
    }

    try {
      if (window.IconLabDB) await window.IconLabDB.createOrder(order);
      else {
        const o = store.orders;
        o.unshift(order);
        store.orders = o;
      }
      store.cart = [];
      location.href = "confirmation.html?id=" + encodeURIComponent(order.id);
    } catch (error) {
      console.error(error);
      toast("تعذر إرسال الطلب. تحقق من الاتصال وحاول مجدداً.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "✓ تأكيد الطلب — الدفع عند الاستلام";
      }
    }
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
let adminTab = "orders";
let adminOrderQuery = "";
let adminStatusFilter = "all";

async function initAdmin() {
  const db = window.IconLabDB;
  const login = $("#login");
  const dash = $("#dash");
  const hint = $("#adminLoginHint");

  if (!db?.isConfigured?.()) {
    login.style.display = "block";
    dash.style.display = "none";
    hint.textContent = "لوحة الإدارة الآمنة تحتاج إعداد Supabase في js/config.js.";
    $("#loginForm").onsubmit = (e) => {
      e.preventDefault();
      toast("أكمل إعداد Supabase أولاً.");
    };
    return;
  }

  const authenticated = await db.restoreAdminSession();
  if (!authenticated) {
    login.style.display = "block";
    dash.style.display = "none";
    hint.textContent = "أدخل حساب المشرف المسجل في Supabase Auth.";

    $("#loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = $("#adminLoginBtn");
      btn.disabled = true;
      btn.textContent = "جاري التحقق...";
      hint.textContent = "";
      try {
        await db.signInAdmin(
          $("#adminEmail").value.trim(),
          $("#adminPassword").value
        );
        toast("✓ تم تسجيل الدخول");
        await initAdmin();
      } catch (error) {
        console.error(error);
        const msg = String(error.message || error);
        hint.textContent = msg.includes("ADMIN_NOT_AUTHORIZED")
          ? "هذا الحساب صحيح لكنه غير مخول كمسؤول."
          : "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.";
      } finally {
        btn.disabled = false;
        btn.textContent = "دخول آمن ←";
      }
    };
    return;
  }

  login.style.display = "none";
  dash.style.display = "block";
  $("#adminIdentity").textContent = db.adminUser?.email || "Admin";

  try {
    await Promise.all([db.adminLoadOrders(), db.adminLoadProducts()]);
  } catch (error) {
    console.error(error);
    toast("تعذر تحميل بيانات لوحة الإدارة");
  }

  $$(".tab").forEach((t) => {
    t.onclick = async () => {
      adminTab = t.dataset.t;
      if (adminTab === "orders") await db.adminLoadOrders();
      if (adminTab === "products") await db.adminLoadProducts();
      renderAdminDashboard();
    };
  });

  $("#logout").onclick = async () => {
    await db.signOutAdmin();
    toast("تم تسجيل الخروج");
    await initAdmin();
  };

  renderAdminDashboard();
}

function renderAdminDashboard() {
  const ps = getProducts();
  const os = store.orders;

  $("#stats").innerHTML = `
    <div class="stat-card"><div class="v">${os.length}</div><div class="l">إجمالي الطلبات</div></div>
    <div class="stat-card"><div class="v">${os.filter((o) => o.status === "New").length}</div><div class="l">طلبات جديدة</div></div>
    <div class="stat-card"><div class="v">${ps.length}</div><div class="l">المنتجات النشطة</div></div>
    <div class="stat-card"><div class="v">${money(os.filter((o) => o.status !== "Cancelled").reduce((a, o) => a + Number(o.total || 0), 0))}</div><div class="l">قيمة الطلبات</div></div>`;

  $$(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.t === adminTab)
  );

  const body = $("#adminBody");

  if (adminTab === "orders") {
    const q = adminOrderQuery.toLowerCase();
    const list = os.filter((o) => {
      const matchesQuery = !q || [
        o.id,
        o.customer?.name,
        o.customer?.phone,
        o.customer?.wilaya
      ].some((v) => String(v || "").toLowerCase().includes(q));
      const matchesStatus =
        adminStatusFilter === "all" || o.status === adminStatusFilter;
      return matchesQuery && matchesStatus;
    });

    body.innerHTML = `
      <div class="admin-tools">
        <input class="f-input" id="adminOrderSearch" placeholder="ابحث برقم الطلب، الاسم، الهاتف أو الولاية..." value="${esc(adminOrderQuery)}">
        <select class="f-select" id="adminStatusFilter">
          ${["all","New","Confirmed","Preparing","Shipped","Delivered","Cancelled"]
            .map((s) => `<option value="${s}" ${s === adminStatusFilter ? "selected" : ""}>${s === "all" ? "كل الحالات" : s}</option>`)
            .join("")}
        </select>
        <button class="btn btn-outline btn-sm" id="refreshOrders">تحديث ↻</button>
      </div>
      <div class="table-card"><table>
        <thead><tr><th>الطلب</th><th>العميل</th><th>الهاتف</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          ${list.length ? list.map((o) => `
            <tr>
              <td><b>${esc(o.id)}</b><br><span style="color:var(--grey);font-size:11px">${esc(o.date || "")}</span></td>
              <td>${esc(o.customer?.name)}<br><span style="color:var(--grey);font-size:11px">${esc(o.customer?.wilaya)}</span></td>
              <td>${esc(o.customer?.phone)}</td>
              <td><b style="color:var(--gold)">${money(Number(o.total || 0))}</b></td>
              <td><span class="status st-${esc(o.status)}">${esc(o.status)}</span></td>
              <td><button class="btn btn-dark btn-sm" onclick="viewOrder('${encodeURIComponent(o.id)}')">عرض</button></td>
            </tr>`).join("") :
            '<tr><td colspan="6" style="text-align:center;color:var(--grey)">لا توجد طلبات مطابقة</td></tr>'}
        </tbody>
      </table></div>`;

    $("#adminOrderSearch").oninput = (e) => {
      adminOrderQuery = e.target.value;
      renderAdminDashboard();
      requestAnimationFrame(() => {
        const input = $("#adminOrderSearch");
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      });
    };
    $("#adminStatusFilter").onchange = (e) => {
      adminStatusFilter = e.target.value;
      renderAdminDashboard();
    };
    $("#refreshOrders").onclick = async () => {
      await window.IconLabDB.adminLoadOrders();
      renderAdminDashboard();
      toast("✓ تم تحديث الطلبات");
    };
    return;
  }

  body.innerHTML = `
    <div class="admin-tools">
      <button class="btn btn-red btn-sm" onclick="editProduct(null)">+ إضافة منتج</button>
      <button class="btn btn-outline btn-sm" id="refreshProducts">تحديث ↻</button>
    </div>
    <div class="table-card"><table>
      <thead><tr><th>المنتج</th><th>السعر</th><th>المخزون</th><th>الألوان</th><th>التخصيص</th><th></th></tr></thead>
      <tbody>
        ${ps.map((product) => `
          <tr>
            <td><b>${esc(product.name)}</b><br><span style="color:var(--grey);font-size:11px">${esc(product.team)}</span></td>
            <td><b style="color:var(--gold)">${money(Number(product.price || 0))}</b></td>
            <td>${Number(product.stock || 0) === 0 ? '<span class="stock-out">Out</span>' : Number(product.stock || 0)}</td>
            <td>${(product.colors || []).map((c) => `<span class="dot" style="background:${c.hex};display:inline-block;margin-right:4px"></span>`).join("")}</td>
            <td>${product.customizable ? '<span class="badge-soft gold">Yes</span>' : '<span class="badge-soft">No</span>'}</td>
            <td style="white-space:nowrap">
              <button class="btn btn-dark btn-sm" onclick="editProduct('${product.id}')">تعديل</button>
              <button class="btn btn-outline btn-sm" onclick="delProduct('${product.id}')">أرشفة</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;

  $("#refreshProducts").onclick = async () => {
    await window.IconLabDB.adminLoadProducts();
    renderAdminDashboard();
    toast("✓ تم تحديث المنتجات");
  };
}

function viewOrder(encodedId) {
  const id = decodeURIComponent(encodedId);
  const o = store.orders.find((x) => x.id === id);
  if (!o) return toast("الطلب غير موجود");

  const sel = ["New","Confirmed","Preparing","Shipped","Delivered","Cancelled"]
    .map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`)
    .join("");

  openModal(`<button class="modal-close" onclick="closeModal()">✕</button><h3>Order ${esc(o.id)}</h3>
    <div class="order-detail">
      <div class="od-row"><span>Customer</span><b>${esc(o.customer?.name)}</b></div>
      <div class="od-row"><span>Phone</span><b>${esc(o.customer?.phone)}</b></div>
      <div class="od-row"><span>Wilaya</span><b>${esc(o.customer?.wilaya)}</b></div>
      <div class="od-row"><span>Commune</span><b>${esc(o.customer?.commune || "—")}</b></div>
      <div class="od-row"><span>Address</span><b>${esc(o.customer?.address)}</b></div>
      <div class="od-row"><span>Delivery Company</span><b>${esc(o.shipping?.companyName || "—")}</b></div>
      <div class="od-row"><span>Notes</span><b>${esc(o.customer?.notes)}</b></div>
      <div class="od-row"><span>Date</span><b>${esc(o.date || "")}</b></div>
    </div>
    <h4 style="margin:14px 0 8px;color:var(--gold)">ITEMS & CUSTOMIZATION</h4>
    <div class="order-items-mini">${(o.items || []).map((it) =>
      `<div class="oi"><img src="${it.preview}" alt="">${it.previewBack ? `<img src="${it.previewBack}" alt="">` : ""}
        <div><b>${esc(it.name)} ×${it.qty}</b> — <b style="color:var(--gold)">${money(Number(it.price || 0) * Number(it.qty || 1))}</b>
        <div class="d">${Object.entries(it.custom || {}).map(([k, v]) => `${esc(k)}: <b>${esc(v)}</b>`).join(" · ")}</div></div>
      </div>`).join("")}</div>
    <div class="order-detail" style="margin-top:14px">
      <div class="od-row"><span>Subtotal</span><b>${money(Number(o.subtotal || 0))}</b></div>
      <div class="od-row"><span>Delivery</span><b>${o.delivery ? money(Number(o.delivery)) : "Free"}</b></div>
      <div class="od-row"><span><b>Total (COD)</b></span><b style="color:var(--gold)">${money(Number(o.total || 0))}</b></div>
    </div>
    <div class="f-row"><label>Order Status</label>
      <select class="f-select" onchange="setStatus('${encodeURIComponent(o.id)}',this.value)">${sel}</select>
    </div>`);
}

async function setStatus(encodedId, status) {
  const id = decodeURIComponent(encodedId);
  try {
    await window.IconLabDB.adminUpdateOrderStatus(id, status);
    toast("✓ Status → " + status);
    closeModal();
    renderAdminDashboard();
  } catch (error) {
    console.error(error);
    toast("تعذر تحديث حالة الطلب");
  }
}

async function delProduct(id) {
  if (!confirm("أرشفة هذا المنتج وإخفاؤه من المتجر؟")) return;
  try {
    await window.IconLabDB.adminArchiveProduct(id);
    toast("✓ تم أرشفة المنتج");
    renderAdminDashboard();
  } catch (error) {
    console.error(error);
    toast("تعذر أرشفة المنتج");
  }
}

function editProduct(id) {
  const product = id
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
    <div class="f-grid2"><div class="f-row"><label>Name</label><input class="f-input" name="name" required value="${esc(product.name)}"></div>
    <div class="f-row"><label>Team</label><input class="f-input" name="team" required value="${esc(product.team)}"></div></div>
    <div class="f-grid2"><div class="f-row"><label>Price (DA)</label><input class="f-input" type="number" min="0" name="price" required value="${product.price}"></div>
    <div class="f-row"><label>Stock</label><input class="f-input" type="number" min="0" name="stock" required value="${product.stock}"></div></div>
    <div class="f-grid2"><div class="f-row"><label>Sizes (comma)</label><input class="f-input" name="sizes" value="${(product.sizes || []).join(",")}"></div>
    <div class="f-row"><label>Pattern</label><select class="f-select" name="pattern">${["plain","stripes","blaugrana","retro"].map((x) => `<option ${x === product.pattern ? "selected" : ""}>${x}</option>`).join("")}</select></div></div>
    <div class="f-row"><label>Colors (name:hex, comma)</label><input class="f-input" name="colors" value="${(product.colors || []).map((c) => c.name + ":" + c.hex).join(",")}" placeholder="White:#f2f2f0, Black:#15151a"></div>
    <div class="f-row"><label>Description</label><textarea class="f-textarea" name="description" rows="3">${esc(product.description)}</textarea></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:18px"><input type="checkbox" name="customizable" ${product.customizable ? "checked" : ""}> Customizable (Live Designer)</label>
    <button class="btn btn-red btn-block">${id ? "Save Changes" : "Add Product"}</button>
   </form>`);
}

async function saveProduct(e, id) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"], button:not([type])');
  const f = new FormData(form);

  const colors = String(f.get("colors"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const pos = s.lastIndexOf(":");
      const name = pos > -1 ? s.slice(0, pos) : s;
      const hex = pos > -1 ? s.slice(pos + 1) : "#999999";
      return { name: name.trim(), hex: hex.trim() || "#999999" };
    });

  const existing = id ? getProduct(id) : null;
  const product = {
    id: id || "p-" + Date.now().toString(36),
    name: String(f.get("name") || "").trim(),
    team: String(f.get("team") || "").trim(),
    price: Number(f.get("price") || 0),
    stock: Number(f.get("stock") || 0),
    sizes: String(f.get("sizes") || "")
      .split(",").map((s) => s.trim()).filter(Boolean),
    colors,
    pattern: f.get("pattern"),
    description: String(f.get("description") || "").trim(),
    customizable: !!f.get("customizable"),
    badge: existing?.badge || null,
    oldPrice: existing?.oldPrice || null,
  };

  button.disabled = true;
  button.textContent = "Saving...";
  try {
    await window.IconLabDB.adminSaveProduct(product);
    closeModal();
    toast("✓ Product saved");
    renderAdminDashboard();
  } catch (error) {
    console.error(error);
    toast("تعذر حفظ المنتج");
    button.disabled = false;
    button.textContent = id ? "Save Changes" : "Add Product";
  }
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
