(() => {
  const $ = (id) => document.getElementById(id);
  // Hindi mag-e-error ang script kahit may nawawalang element sa HTML
  const on = (id, type, fn) => { const el = $(id); if (el) el.addEventListener(type, fn); };
  const searchBar = $("searchBar");
  const searchInput = $("searchInput");
  const settingsBtn = $("settingsBtn");
  const settingsMenu = $("settingsMenu");
  const cartDrawer = $("cartDrawer");
  const overlay = $("overlay");
  const toastElement = $("toast");

  let toastTimer;

  // SETTINGS MENU (Contacts + Shipping information)
  if (settingsBtn && settingsMenu) settingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    const opening = settingsMenu.hidden;
    settingsMenu.hidden = !opening;

    settingsBtn.setAttribute("aria-expanded", String(opening));
  });

  // Isara ang menu kapag nag-click sa labas
  document.addEventListener("click", (event) => {
    if (settingsMenu && settingsBtn && !settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
      settingsMenu.hidden = true;
      settingsBtn.setAttribute("aria-expanded", "false");
    }
  });


  // SAFE LOCAL STORAGE
  function getSavedTheme() {
    try {
      return localStorage.getItem("tnf-theme") || "dark";
    } catch {
      return "dark";
    }
  }

  // TOAST MESSAGE
  function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toastElement.classList.remove("show");
    }, 2500);
  }

  // SEARCH BUTTON
  on("searchBtn", "click", () => {
    const opening = searchBar.hidden;
    searchBar.hidden = !opening;

    if (opening) {
      searchInput.focus();
    } else {
      searchInput.value = "";
    }
  });

  // SEARCH SUBMIT
  searchBar.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = searchInput.value.trim();

    if (!query) {
      showToast("Please enter something to search.");
      searchInput.focus();
      return;
    }

    showToast("No products available yet. Coming soon!");

    // This homepage does not have product listings yet.
  });

  // OPEN CART
  function openCart() {
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  // CLOSE CART
  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  on("cartBtn", "click", openCart);
  on("cartClose", "click", closeCart);
  if (overlay) overlay.addEventListener("click", closeCart);

  // CONTINUE BROWSING
  on("continueShopping", "click", () => {
    closeCart();

    $("shop").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  // Gamitin ang naka-save na theme
  document.documentElement.dataset.theme = getSavedTheme();

  // SMOOTH NAVIGATION
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      const target = document.querySelector(selector);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // ESCAPE KEY
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeCart();
    searchBar.hidden = true;
    searchInput.value = "";

    if (settingsMenu) settingsMenu.hidden = true;
    if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "false");
  });
})();