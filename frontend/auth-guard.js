// auth-guard.js
document.addEventListener('DOMContentLoaded', () => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PUBLIC = new Set(['login.html', 'registration.html', 'index.html']);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // ---------- Route protection ----------
  if (user && (page === 'login.html' || page === 'registration.html' || page === 'index.html')) {
    location.replace('home.html');
    return;
  }
  if (!user && !PUBLIC.has(page)) {
    location.replace('login.html');
    return;
  }

  // ---------- Navbar replacement when logged in ----------
  if (user) {
    document.body.classList.add('auth-logged-in');

    const cta = document.getElementById('nav-cta') || document.querySelector('.buttons');
    if (cta) {
      cta.innerHTML = `
        <div class="nav-user">
          <button id="userMenuBtn" class="user-btn" aria-haspopup="true" aria-expanded="false">
            Hi, ${user.name || 'User'} <span aria-hidden="true">▾</span>
          </button>
          <div id="userMenu" class="user-menu" role="menu" aria-hidden="true">
            <a role="menuitem" href="mybookings.html">My Bookings</a>
            <a role="menuitem" href="pnr.html">PNR Status</a>
            <a role="menuitem" id="profileLink" href="profile.html">Profile</a>
            <hr>
            <button role="menuitem" id="logoutBtn" class="logout-btn">Logout</button>
          </div>
        </div>
      `;

      const btn  = document.getElementById('userMenuBtn');
      const menu = document.getElementById('userMenu');

      // prefill profile link with UID if available
      const prof = document.getElementById('profileLink');
      if (prof && user._id) prof.href = `profile.html?uid=${encodeURIComponent(user._id)}`;

      // toggle
      const openMenu = () => {
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
      };
      const closeMenu = () => {
        menu.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
      };

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.contains('show') ? closeMenu() : openMenu();
      });

      // close on outside click
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) closeMenu();
      });

      // close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });

      // logout
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        location.replace('login.html');
      });
    }
  }
});
