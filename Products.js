(() => {
  const $ = (id) => document.getElementById(id);
  const on = (id, type, fn) => { const el = $(id); if (el) el.addEventListener(type, fn); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const peso = (n) => "₱" + n.toLocaleString("en-PH");

  // Put the product images in the "assets" folder (export them from Figma).
  // If a file is missing, a drawn T-shirt placeholder is shown instead.
  const PRODUCTS = [
    { id: "gray-carhartt", name: "“Gray Carhartt T-Shirt”",   price: 200, img: "gray-carhartt.png",   tone: "#5a5450", ink: "#ffffff" },
    { id: "new-york-city", name: "“New York City T-Shirt”",   price: 150, img: "new-york-city.png",   tone: "#141414", ink: "#ffffff" },
    { id: "liberty",       name: "“Liberty Striped T-Shirt”", price: 100, img: "liberty-striped.png", tone: "#f4f1ec", ink: "#c8102e" },
    { id: "doormats",      name: "“Doormats Only Hoodie”",    price: 400, img: "doormats-only.png",   tone: "#141414", ink: "#d9a441" },
    { id: "in-god",        name: "“In God We Trust Hoodie”",  price: 400, img: "in-god-we-trust.png", tone: "#b8b8b8", ink: "#222222" },
  ];

  const searchBar = $("searchBar");
  const searchInput = $("searchInput");
  const settingsBtn = $("settingsBtn");
  const settingsMenu = $("settingsMenu");
  const toastElement = $("toast");
  const grid = $("productGrid");

  let toastTimer;

  // SAFE LOCAL STORAGE (theme only)
  function getSavedTheme() {
    try { return localStorage.getItem("tnf-theme") || "dark"; }
    catch { return "dark"; }
  }

  // TOAST MESSAGE
  function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastElement.classList.remove("show"), 2500);
  }

  // PRODUCT IMAGES (with placeholder if the file is missing)
  function teeSvg(p) {
    return `<svg viewBox="0 0 200 220" role="img" aria-label="${esc(p.name)}">
      <path d="M70 20 L20 45 L38 90 L58 80 L58 200 L142 200 L142 80 L162 90 L180 45 L130 20 Q100 45 70 20Z"
            fill="${p.tone}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <text x="100" y="110" text-anchor="middle" font-family="Playfair Display, Georgia, serif"
            font-weight="800" font-size="14" fill="${p.ink}">ThriftNFit</text></svg>`;
  }

  // error events do not bubble, so listen in the capture phase
  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.fallback) return;
    const p = PRODUCTS.find((x) => x.id === img.dataset.fallback);
    if (!p) return;
    const tpl = document.createElement("template");
    tpl.innerHTML = teeSvg(p).trim();
    img.replaceWith(tpl.content.firstChild);
  }, true);

  // PRODUCT GRID
  function renderProducts(query = "") {
    const q = query.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));

    grid.innerHTML = list.map((p) => `
      <article class="product" data-id="${p.id}" role="link" tabindex="0" style="cursor:pointer">
        <div class="product__img">
          <img src="assets/${p.img}" alt="${esc(p.name)}" data-fallback="${p.id}">
        </div>
        <h2 class="product__name">${esc(p.name)}</h2>
        <p class="product__price">${peso(p.price)}</p>
      </article>`).join("");

    $("emptyMsg").hidden = list.length > 0;
  }

  // Buksan ang product page kapag pinindot ang isang produkto
  function openProduct(event) {
    const card = event.target.closest(".product");
    if (card) location.href = "product.html?id=" + encodeURIComponent(card.dataset.id);
  }
  grid.addEventListener("click", openProduct);
  grid.addEventListener("keydown", (event) => {
    if (event.key === "Enter") openProduct(event);
  });

  // SEARCH
  on("searchBtn", "click", () => {
    const opening = searchBar.hidden;
    searchBar.hidden = !opening;
    if (opening) {
      searchInput.focus();
    } else {
      searchInput.value = "";
      renderProducts();
    }
  });

  searchInput.addEventListener("input", () => renderProducts(searchInput.value));

  searchBar.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!searchInput.value.trim()) {
      showToast("Please enter something to search.");
      searchInput.focus();
    }
  });

  on("searchClose", "click", () => {
    searchBar.hidden = true;
    searchInput.value = "";
    renderProducts();
  });

  // CART (not working yet)
  on("cartBtn", "click", () => showToast("Cart is coming soon!"));

  // SETTINGS MENU (Contacts + Shipping information)
  settingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = settingsMenu.hidden;
    settingsMenu.hidden = !opening;
    settingsBtn.setAttribute("aria-expanded", String(opening));
  });

  document.addEventListener("click", (event) => {
    if (!settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
      settingsMenu.hidden = true;
      settingsBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Gamitin ang naka-save na theme (galing sa front page)
  document.documentElement.dataset.theme = getSavedTheme();

  // ESCAPE KEY
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    searchBar.hidden = true;
    searchInput.value = "";
    renderProducts();
    settingsMenu.hidden = true;
    settingsBtn.setAttribute("aria-expanded", "false");
  });

  renderProducts();
})();