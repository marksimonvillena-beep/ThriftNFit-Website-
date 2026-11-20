(() => {
  // Image files go in the assets/ folder (export them from Figma).
  // If a file is missing, a drawn T-shirt placeholder is shown instead.
  const PRODUCTS = [
    { id: "blossom",   name: '"Blossom" Tee in Dark Brown Colorway', price: 800, img: "tee-blossom.png",   tone: "#4a2f22", ink: "#f6c9d4" },
    { id: "script",    name: '"Script" Tee in Black Colorway',       price: 800, img: "tee-script.png",    tone: "#141414", ink: "#e56b9a" },
    { id: "among-all", name: "ThriftNFit Among All",                 price: 750, img: "tee-among-all.png", tone: "#f4f1ec", ink: "#c8102e" },
    { id: "panther",   name: '"Panther" Tee in Black Colorway',      price: 750, img: "tee-panther.png",   tone: "#141414", ink: "#6b4fb3" },
    { id: "anime",     name: '"Anime" Tee',                          price: 750, img: "tee-anime.png",     tone: "#141414", ink: "#4a7bff" },
  ];
  const SIZES = ["S", "M", "L", "XL"];

  const $ = (id) => document.getElementById(id);  
  const peso = (n) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- safe storage (shared with the front page) ----
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // cart line: { key, name, price, size?, qty }
  const validLine = (l) => l && l.key && l.name && Number.isFinite(l.price) && l.qty > 0;
  let cart = store.get("tnf-cart", []).filter(validLine);

  // ---- toast ----
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  // ---- images (with placeholder fallback) ----
  function teeSvg(p) {
    return `<svg viewBox="0 0 200 220" role="img" aria-label="${esc(p.name)}">
      <path d="M70 20 L20 45 L38 90 L58 80 L58 200 L142 200 L142 80 L162 90 L180 45 L130 20 Q100 45 70 20Z"
            fill="${p.tone}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <text x="100" y="110" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
            font-weight="800" font-size="14" fill="${p.ink}">ThriftNFit</text></svg>`;
  }
  const imgHtml = (p) =>
    `<img src="assets/${p.img}" alt="${esc(p.name)}" data-fallback="${p.id}">`;

  // error events don't bubble, so listen in the capture phase
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.fallback) return;
    const p = PRODUCTS.find((x) => x.id === img.dataset.fallback);
    if (!p) return;
    const tpl = document.createElement("template");
    tpl.innerHTML = teeSvg(p).trim();
    img.replaceWith(tpl.content.firstChild);
  }, true);

  // ---- product grid ----
  const grid = $("productGrid");
  function renderProducts(query = "") {
    const q = query.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
    grid.innerHTML = list.map((p) => `
      <button class="p-card" type="button" data-open="${p.id}">
        <span class="p-card__img">${imgHtml(p)}</span>
        <span class="p-card__name">${esc(p.name)}</span>
        <span class="p-card__price">${peso(p.price)}</span>
      </button>`).join("");
    $("emptyMsg").hidden = list.length > 0;
  }
  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-open]");
    if (card) openModal(card.dataset.open);
  });

  // ---- product modal ----
  const modal = $("productModal");
  let current = null, size = null, qty = 1;

  function openModal(id) {
    current = PRODUCTS.find((p) => p.id === id);
    if (!current) return;
    size = null; qty = 1;
    $("pmImg").innerHTML = imgHtml(current);
    $("pmName").textContent = current.name;
    $("pmPrice").textContent = peso(current.price);
    $("pmQty").textContent = qty;
    $("pmError").textContent = "";
    $("pmSizes").innerHTML = SIZES.map((s) =>
      `<label><input type="radio" name="size" value="${s}"><span>${s}</span></label>`).join("");
    modal.showModal();
  }
  $("pmSizes").addEventListener("change", (e) => {
    size = e.target.value;
    $("pmError").textContent = "";
  });
  $("pmInc").addEventListener("click", () => { qty = Math.min(qty + 1, 10); $("pmQty").textContent = qty; });
  $("pmDec").addEventListener("click", () => { qty = Math.max(qty - 1, 1); $("pmQty").textContent = qty; });
  $("pmClose").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  $("pmAdd").addEventListener("click", () => {
    if (!size) { $("pmError").textContent = "Please choose a size."; return; }
    const key = current.id + "-" + size;
    const line = cart.find((l) => l.key === key);
    if (line) line.qty += qty;
    else cart.push({ key, name: current.name, price: current.price, size, qty });
    saveCart();
    modal.close();
    toast("Added to cart");
  });

  // ---- cart ----
  function saveCart() { store.set("tnf-cart", cart); renderCart(); }
  function renderCart() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const badge = $("cartCount");
    badge.textContent = count;
    badge.hidden = count === 0;

    $("cartList").innerHTML = cart.length
      ? cart.map((l) => `
          <li>
            <div><strong>${esc(l.name)}</strong><br><span>${l.size ? "Size " + esc(l.size) + " · " : ""}${peso(l.price)}</span></div>
            <strong>${peso(l.price * l.qty)}</strong>
            <div class="qty">
              <button data-dec="${esc(l.key)}" aria-label="Decrease">−</button>
              <span>${l.qty}</span>
              <button data-inc="${esc(l.key)}" aria-label="Increase">+</button>
            </div>
            <button class="remove" data-rm="${esc(l.key)}">Remove</button>
          </li>`).join("")
      : '<li class="cart-empty">Your cart is empty.</li>';

    $("cartTotal").textContent = peso(cart.reduce((s, l) => s + l.price * l.qty, 0));
  }
  $("cartList").addEventListener("click", (e) => {
    const t = e.target;
    const key = t.dataset.inc || t.dataset.dec || t.dataset.rm;
    if (!key) return;
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    if (t.dataset.inc) line.qty++;
    if (t.dataset.dec) line.qty--;
    if (t.dataset.rm || line.qty <= 0) cart = cart.filter((l) => l.key !== key);
    saveCart();
  });

  const drawer = $("cartDrawer"), overlay = $("overlay");
  function openCart() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
  }
  function closeCart() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }
  $("cartBtn").addEventListener("click", openCart);
  $("cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  $("checkoutBtn").addEventListener("click", () => {
    if (!cart.length) return toast("Your cart is empty");
    cart = [];
    saveCart();
    closeCart();
    toast("Thanks! This is a demo checkout.");
  });

  // ---- search ----
  const bar = $("searchBar"), input = $("searchInput");
  function openSearch() { bar.hidden = false; input.focus(); }
  function closeSearch() { bar.hidden = true; input.value = ""; renderProducts(); }
  $("searchBtn").addEventListener("click", () => (bar.hidden ? openSearch() : closeSearch()));
  $("searchClose").addEventListener("click", closeSearch);
  input.addEventListener("input", () => renderProducts(input.value));

  // ---- settings ----
  const sBtn = $("settingsBtn"), sMenu = $("settingsMenu");
  function toggleMenu(open) {
    sMenu.hidden = !open;
    sBtn.setAttribute("aria-expanded", String(open));
  }
  sBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(sMenu.hidden); });
  document.addEventListener("click", (e) => { if (!sMenu.contains(e.target)) toggleMenu(false); });

  function applyTheme(light) {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    $("themeToggle").checked = light;
  }
  $("themeToggle").addEventListener("change", (e) => {
    applyTheme(e.target.checked);
    store.set("tnf-theme", e.target.checked ? "light" : "dark");
  });
  $("clearCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    toggleMenu(false);
    toast("Cart cleared");
  });

  // ---- keyboard ----
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCart();
    toggleMenu(false);
    if (!bar.hidden) closeSearch();
  });

  // ---- init ----
  applyTheme(store.get("tnf-theme", "dark") === "light");
  renderProducts();
  renderCart();
})();