/* ============ ICONLAB DATA PROVIDER ============
   Public storefront + authenticated admin operations.
*/
(function () {
  const cfg = window.ICONLAB_CONFIG || {};
  const SESSION_KEY = "il_admin_session";

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
    designs: [],
    admin: null
  };

  const isConfigured = () =>
    Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.DATA_MODE !== "local");

  const baseUrl = () => String(cfg.SUPABASE_URL || "").replace(/\/$/, "");

  const parseResponse = async (response) => {
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const publicApi = async (path, options = {}) => {
    const response = await fetch(baseUrl() + "/rest/v1/" + path, {
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
      throw new Error("IconLab DB " + response.status + ": " + await response.text());
    }
    return parseResponse(response);
  };

  const authRequest = async (path, options = {}) => {
    const response = await fetch(baseUrl() + "/auth/v1/" + path, {
      ...options,
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error("IconLab Auth " + response.status + ": " + body);
    }
    return parseResponse(response);
  };

  const saveSession = (session) => {
    if (!session) {
      sessionStorage.removeItem(SESSION_KEY);
      state.admin = null;
      return;
    }
    const expiresAt = session.expires_at ||
      Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    const clean = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: expiresAt,
      user: session.user || null
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
    state.admin = clean;
  };

  const readSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch (_) {
      return null;
    }
  };

  const refreshSession = async (session) => {
    if (!session?.refresh_token) return null;
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    saveSession(refreshed);
    return state.admin;
  };

  const getAdminSession = async () => {
    if (!isConfigured()) return null;
    let session = state.admin || readSession();
    if (!session) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!session.access_token || !session.expires_at || session.expires_at <= now + 60) {
      try {
        session = await refreshSession(session);
      } catch (_) {
        saveSession(null);
        return null;
      }
    } else {
      state.admin = session;
    }
    return session;
  };

  const adminApi = async (path, options = {}) => {
    const session = await getAdminSession();
    if (!session?.access_token) throw new Error("ADMIN_AUTH_REQUIRED");
    const response = await fetch(baseUrl() + "/rest/v1/" + path, {
      ...options,
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      throw new Error("IconLab Admin DB " + response.status + ": " + await response.text());
    }
    return parseResponse(response);
  };

  const normalizeRows = (rows) => (rows || []).map((row) => row.payload || row);

  const verifyAdmin = async () => {
    const session = await getAdminSession();
    if (!session) return false;
    const result = await adminApi("rpc/is_admin", {
      method: "POST",
      body: "{}"
    });
    return result === true;
  };

  const IconLabDB = {
    get mode() { return state.mode; },
    get products() { return state.products; },
    get orders() { return state.orders; },
    get adminUser() { return state.admin?.user || null; },
    isConfigured,

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
        const rows = await publicApi("products?select=id,payload&active=eq.true&order=sort_order.asc");
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

      await publicApi("orders", {
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
      return order;
    },

    async createDesign(design) {
      state.designs = [design, ...state.designs.filter((x) => x.id !== design.id)];
      local.write("il_designs", state.designs);
      if (state.mode !== "supabase") return design;

      await publicApi("designs", {
        method: "POST",
        body: JSON.stringify({
          id: design.id,
          product_id: design.productId || null,
          payload: design
        })
      });
      return design;
    },

    async signInAdmin(email, password) {
      if (!isConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
      const session = await authRequest("token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      saveSession(session);
      const allowed = await verifyAdmin();
      if (!allowed) {
        await this.signOutAdmin();
        throw new Error("ADMIN_NOT_AUTHORIZED");
      }
      return state.admin?.user || null;
    },

    async restoreAdminSession() {
      if (!isConfigured()) return false;
      try {
        const allowed = await verifyAdmin();
        if (!allowed) saveSession(null);
        return allowed;
      } catch (_) {
        saveSession(null);
        return false;
      }
    },

    async signOutAdmin() {
      const session = await getAdminSession();
      if (session?.access_token) {
        try {
          await authRequest("logout", {
            method: "POST",
            headers: { Authorization: "Bearer " + session.access_token }
          });
        } catch (_) {}
      }
      saveSession(null);
    },

    async adminLoadOrders() {
      const rows = await adminApi(
        "orders?select=id,status,total,payload,created_at&order=created_at.desc"
      );
      state.orders = (rows || []).map((row) => ({
        ...(row.payload || {}),
        id: row.id,
        status: row.status,
        total: Number(row.total ?? row.payload?.total ?? 0)
      }));
      local.write("il_orders", state.orders);
      return state.orders;
    },

    async adminLoadProducts() {
      const rows = await adminApi(
        "products?select=id,payload,active,sort_order&order=sort_order.asc"
      );
      state.products = (rows || [])
        .filter((row) => row.active !== false)
        .map((row) => row.payload || row);
      local.write("il_products", state.products);
      return state.products;
    },

    async adminSaveProduct(product) {
      await adminApi("products?on_conflict=id", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify({
          id: product.id,
          payload: product,
          active: true,
          sort_order: product.sortOrder || 100
        })
      });
      const list = state.products.filter((x) => x.id !== product.id);
      list.push(product);
      state.products = list;
      local.write("il_products", state.products);
      return product;
    },

    async adminArchiveProduct(id) {
      await adminApi("products?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify({ active: false })
      });
      state.products = state.products.filter((x) => x.id !== id);
      local.write("il_products", state.products);
    },

    async adminUpdateOrderStatus(orderId, status) {
      const order = state.orders.find((x) => x.id === orderId);
      const payload = order ? { ...order, status } : { id: orderId, status };
      await adminApi("orders?id=eq." + encodeURIComponent(orderId), {
        method: "PATCH",
        body: JSON.stringify({ status, payload, updated_at: new Date().toISOString() })
      });
      if (order) order.status = status;
      local.write("il_orders", state.orders);
      return order;
    }
  };

  window.IconLabDB = IconLabDB;
})();
