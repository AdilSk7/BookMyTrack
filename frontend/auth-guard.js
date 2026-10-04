// auth-guard.js
document.addEventListener('DOMContentLoaded', () => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PUBLIC = new Set(['login.html', 'registration.html', 'index.html', 'home.html', 'about.html', 'contact.html', 'feedback.html', 'admin-login.html']);
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

  // ---------- Navbar logic based on Auth State ----------
  const cta = document.getElementById('nav-cta') || document.querySelector('.buttons');
  
  if (user) {
    // 1) Logic for Logged In User
    document.body.classList.add('auth-logged-in');

    if (cta) {
      cta.innerHTML = `
        <div class="nav-user">
          <button id="userMenuBtn" class="user-btn" aria-haspopup="true" aria-expanded="false" style="display: flex; align-items: center; gap: 10px; border: none; background: transparent; padding: 4px 8px; color: inherit; font-size: inherit; font-weight: 500; cursor: pointer; white-space: nowrap;">
            <div style="background-color: #0088ff; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; color: white; font-size: 16px; flex-shrink: 0;">
              <i class="fa-solid fa-user"></i>
            </div>
            Hi, ${user.name || 'User'} <i class="fa-solid fa-chevron-down" style="font-size: 12px; margin-left: 2px;"></i>
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
        location.replace('home.html');
      });
    }
  } else {
    // 2) Logic for Guest (Not Logged In)
    if (cta) {
      cta.innerHTML = `
        <a href="login.html"><button>Login</button></a>
        <a href="registration.html"><button>Sign Up</button></a>
      `;
      
      // Hide protected links from the navbar for guests
      const protectedLinks = ['reservation.html', 'schedule.html', 'fare.html', 'pnr.html', 'mybookings.html'];
      document.querySelectorAll('nav .links a').forEach(a => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (protectedLinks.some(link => href.includes(link))) {
          a.style.display = 'none';
        }
      });
    }
  }
});
