// Builds the Menu page from `menu-data 1.json` (category -> items[])
(() => {
  const MENU_JSON_URL = 'menu-data%201.json'; // space-safe URL for "menu-data 1.json"
  const FALLBACK_IMAGE_URL = 'assets/images/food_variety.jpg';

  const sectionsRoot = document.getElementById('menu-sections');
  const emptyState = document.getElementById('menu-empty-state');
  const filterTrigger = document.getElementById('menu-filter-trigger');
  const filterValueEl = document.querySelector('#menu-filter-trigger .filter-dd-value');
  const filterMenu = document.getElementById('menu-filter-options');

  const CATEGORY_ID_OVERRIDES = {
    // JSON uses "Briyani" but the UI/filter buttons use "biriyani"
    'Briyani': 'biriyani',
  };

  function slugifyCategory(input) {
    if (CATEGORY_ID_OVERRIDES[input]) return CATEGORY_ID_OVERRIDES[input];
    return String(input || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, '') // match existing filter id "breads-parottas" (not "breads-and-parottas")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizePrice(price) {
    const p = String(price ?? '').trim();
    return p;
  }

  function createMenuCard(item, categorySlug) {
    const title = String(item?.['food-title'] ?? '').trim();
    const description = String(item?.description ?? '').trim();
    const price = normalizePrice(item?.['food-price']);

    const card = document.createElement('article');
    card.className = 'menu-card';
    card.dataset.category = categorySlug;

    const imageWrap = document.createElement('div');
    imageWrap.className = 'menu-card-image';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = title || 'Menu item';

    const imgUrl = String(item?.['img-url'] ?? '').trim();
    img.src = imgUrl || FALLBACK_IMAGE_URL;
    img.onerror = () => {
      // Avoid infinite loop if fallback is missing
      if (img.src.endsWith(FALLBACK_IMAGE_URL)) return;
      img.src = FALLBACK_IMAGE_URL;
    };
    imageWrap.appendChild(img);

    const content = document.createElement('div');
    content.className = 'menu-card-content';

    const head = document.createElement('div');
    head.className = 'menu-item-head';

    const h3 = document.createElement('h3');
    h3.className = 'menu-item-name';
    h3.textContent = title || 'Untitled';

    head.appendChild(h3);

    const priceEl = document.createElement('span');
    priceEl.className = 'menu-item-price';
    if (price) {
      priceEl.textContent = price;
    } else {
      priceEl.textContent = '—';
      priceEl.classList.add('is-empty');
      priceEl.title = 'Price not available';
    }
    head.appendChild(priceEl);

    const p = document.createElement('p');
    p.className = 'menu-item-description';
    p.textContent = description || '';

    content.appendChild(head);
    if (description) content.appendChild(p);

    card.appendChild(imageWrap);
    card.appendChild(content);
    return card;
  }

  function createMenuSection(categoryName, categoryData) {
    const section = document.createElement('section');
    section.className = 'menu-section';

    const categorySlug = slugifyCategory(categoryName);
    section.id = categorySlug;

    const h2 = document.createElement('h2');
    h2.className = 'menu-category-title';
    h2.textContent = categoryName;

    const grid = document.createElement('div');
    grid.className = 'menu-grid';

    const items = Array.isArray(categoryData?.items) ? categoryData.items : [];
    items.forEach((item) => grid.appendChild(createMenuCard(item, categorySlug)));

    section.appendChild(h2);
    section.appendChild(grid);
    return section;
  }

  function setEmptyStateVisible(isVisible) {
    if (!emptyState) return;
    emptyState.hidden = !isVisible;
  }

  function setSectionsVisibility(filter) {
    const sections = document.querySelectorAll('.menu-section');
    if (filter === 'all') {
      sections.forEach((s) => (s.style.display = 'block'));
      setEmptyStateVisible(false);
      return;
    }

    let anyShown = false;
    sections.forEach((s) => {
      const show = s.id === filter;
      s.style.display = show ? 'block' : 'none';
      if (show) anyShown = true;
    });
    setEmptyStateVisible(!anyShown);
  }

  function applyFilter(filter) {
    const f = filter || 'all';
    setSectionsVisibility(f);

    // Sync active button state (for desktop)
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach((b) => b.classList.remove('active'));
    const activeBtn = Array.from(filterBtns).find((b) => (b.getAttribute('data-filter') || 'all') === f);
    if (activeBtn) activeBtn.classList.add('active');

    // Sync dropdown state (for mobile custom dropdown)
    if (filterValueEl && activeBtn) filterValueEl.textContent = activeBtn.textContent?.trim() || 'All';
    if (filterMenu) {
      Array.from(filterMenu.querySelectorAll('.filter-dd-option')).forEach((opt) => {
        opt.classList.toggle('is-active', (opt.getAttribute('data-filter') || 'all') === f);
      });
    }

    // Scroll
    if (f !== 'all') {
      const target = document.getElementById(f);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function wireFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') || 'all';
        applyFilter(filter);
      });
    });
  }

  function setDropdownOpen(isOpen) {
    if (!filterTrigger || !filterMenu) return;
    filterTrigger.setAttribute('aria-expanded', String(isOpen));
    filterMenu.hidden = !isOpen;
  }

  function wireFilterDropdown() {
    if (!filterTrigger || !filterMenu) return;

    // Build options from existing buttons (keeps labels consistent)
    const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    const seen = new Set();
    filterMenu.innerHTML = '';

    filterBtns.forEach((btn) => {
      const value = btn.getAttribute('data-filter') || 'all';
      if (seen.has(value)) return;
      seen.add(value);

      const optBtn = document.createElement('button');
      optBtn.type = 'button';
      optBtn.className = 'filter-dd-option';
      optBtn.setAttribute('role', 'option');
      optBtn.setAttribute('data-filter', value);
      optBtn.textContent = btn.textContent?.trim() || value;
      optBtn.addEventListener('click', () => {
        setDropdownOpen(false);
        applyFilter(value);
      });
      filterMenu.appendChild(optBtn);
    });

    filterTrigger.addEventListener('click', () => {
      const isOpen = filterTrigger.getAttribute('aria-expanded') === 'true';
      setDropdownOpen(!isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      const inside = filterTrigger.contains(t) || filterMenu.contains(t);
      if (!inside) setDropdownOpen(false);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    });
  }

  function disableMissingFilterButtons() {
    const sections = new Set(Array.from(document.querySelectorAll('.menu-section')).map((s) => s.id));
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach((btn) => {
      const filter = btn.getAttribute('data-filter') || 'all';
      if (filter === 'all') return;
      if (!sections.has(filter)) {
        btn.disabled = true;
        btn.title = 'No items available';
      }
    });

    // Disable missing dropdown options too (mobile)
    if (filterMenu) {
      Array.from(filterMenu.querySelectorAll('.filter-dd-option')).forEach((opt) => {
        const v = opt.getAttribute('data-filter') || 'all';
        if (v === 'all') return;
        if (!sections.has(v)) opt.disabled = true;
      });
    }
  }

  function wireMobileNavClose() {
    const navLinks = document.querySelectorAll('.nav a');
    const menuToggle = document.getElementById('menu-toggle');
    if (!menuToggle) return;
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.checked = false;
      });
    });
  }

  async function loadAndRender() {
    if (!sectionsRoot) return;

    sectionsRoot.innerHTML =
      '<section class="menu-section"><h2 class="menu-category-title">Loading Menu...</h2></section>';

    try {
      const res = await fetch(MENU_JSON_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load menu JSON (${res.status})`);
      const data = await res.json();

      sectionsRoot.innerHTML = '';

      const entries = Object.entries(data || {});
      if (!entries.length) {
        sectionsRoot.innerHTML =
          '<section class="menu-section"><h2 class="menu-category-title">Menu unavailable</h2></section>';
        setEmptyStateVisible(true);
        return;
      }

      for (const [categoryName, categoryData] of entries) {
        sectionsRoot.appendChild(createMenuSection(categoryName, categoryData));
      }

      wireFilterDropdown();
      wireFilters();
      disableMissingFilterButtons();
      wireMobileNavClose();
      applyFilter('all');
    } catch (err) {
      sectionsRoot.innerHTML = `
        <section class="menu-section">
          <h2 class="menu-category-title">Couldn’t load the menu</h2>
          <p class="menu-load-error">
            If you opened this page as a file, please run it via a local server (like VS Code “Live Server”)
            so the browser can fetch <strong>menu-data 1.json</strong>.
          </p>
        </section>
      `;
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  loadAndRender();
})();


