/* ============ ICONLAB DATA PROVIDER ============
   Supabase-first with an automatic local fallback.
   Public operations are intentionally limited to:
   - read products
   - create orders
   - create designs
   Admin reads/writes will move to authenticated access in the next stage.
*/
(function () {
  const cfg = window.ICONLAB_CONFIG || {};
  const local = {
    read(key, fallback) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value == null ? fallback : value;
      } catch (_) {
        return fallback;
      }
    },
    write(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const state = {
    mode: "local",
    products: [],
    orders: [],
    designs: []
  };

  const isConfigured = () =>
    Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.DATA_MODE !== "local");

  const api = async (path, options = {}) => {
    const base = String(cfg.SUPABASE_URL || "").replace(/\/$/, "");
    const response = await fetch(base + "/rest/v1/" + path, {
      ...options,
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error("IconLab DB " + response.status + ": " + message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const normalizeRows = (rows) =>
    (rows || []).map((row) => row.payload || row);

  const IconLabDB = {
    get mode() {
      return state.mode;
    },
    get products() {
      return state.products;
    },
    get orders() {
      return state.orders;
    },

    async init() {
      state.products = local.read("il_products", null) || [...DEFAULT_PRODUCTS];
      state.orders = local.read("il_orders", []);
      state.designs = local.read("il_designs", []);

      if (!isConfigured()) {
        state.mode = "local";
        local.write("il_products", state.products);
        return state;
      }

      try {
        const rows = await api("products?select=id,payload&active=eq.true&order=sort_order.asc");
        const remoteProducts = normalizeRows(rows);
        if (remoteProducts.length) {
          state.products = remoteProducts;
          local.write("il_products", state.products);
        }
        state.mode = "supabase";
      } catch (error) {
        console.warn("[IconLab] Supabase unavailable; using local fallback.", error);
        state.mode = "local";
      }
      return state;
    },

    setLocalProducts(products) {
      state.products = Array.isArray(products) ? products : [];
      local.write("il_products", state.products);
    },

    setLocalOrders(orders) {
      state.orders = Array.isArray(orders) ? orders : [];
      local.write("il_orders", state.orders);
    },

    async createOrder(order) {
      state.orders = [order, ...state.orders.filter((x) => x.id !== order.id)];
      local.write("il_orders", state.orders);

      if (state.mode !== "supabase") return order;

      try {
        await api("orders", {
          method: "POST",
          body: JSON.stringify({
            id: order.id,
            customer_phone: order.customer?.phone || null,
            wilaya: order.customer?.wilaya || null,
            status: order.status || "New",
            total: order.total || 0,
            payload: order
          })
        });
      } catch (error) {
        console.error("[IconLab] Order saved locally but remote submission failed.", error);
        throw error;
      }
      return order;
    },

    async createDesign(design) {
      state.designs = [design, ...state.designs.filter((x) => x.id !== design.id)];
      local.write("il_designs", state.designs);
      if (state.mode !== "supabase") return design;

      await api("designs", {
        method: "POST",
        body: JSON.stringify({
          id: design.id,
          product_id: design.productId || null,
          payload: design
        })
      });
      return design;
    }
  };

  window.IconLabDB = IconLabDB;
})();
