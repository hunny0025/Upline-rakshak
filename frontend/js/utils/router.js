/* ===== SPA Router ===== */
const Router = {
  routes: {},
  currentPage: null,
  
  register(path, renderFn) {
    this.routes[path] = renderFn;
  },

  navigate(path) {
    window.location.hash = path;
  },

  init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    // Initialize with current hash or default
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    } else {
      this._handleRoute();
    }
  },

  _handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace('#', '');
    
    const renderFn = this.routes[path];
    if (renderFn) {
      this._transition(path, renderFn);
    } else {
      // Fallback to dashboard
      this.navigate('/dashboard');
    }
  },

  _transition(path, renderFn) {
    const app = document.getElementById('app');
    const pageContainer = document.getElementById('page-container');
    
    if (!pageContainer) return;

    // Remove active from all pages
    const oldPage = pageContainer.querySelector('.page.active');
    if (oldPage) {
      oldPage.classList.remove('active');
    }

    // Render new page
    pageContainer.innerHTML = '';
    const pageEl = renderFn();
    if (typeof pageEl === 'string') {
      pageContainer.innerHTML = pageEl;
      const newPage = pageContainer.querySelector('.page');
      if (newPage) newPage.classList.add('active');
    } else if (pageEl instanceof HTMLElement) {
      pageContainer.appendChild(pageEl);
      pageEl.classList.add('active');
    }

    this.currentPage = path;

    // Update navigation
    this._updateNav(path);
  },

  _updateNav(path) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === path);
    });
  }
};
