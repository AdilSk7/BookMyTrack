(function () {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PUBLIC = new Set(['login.html','registration.html','index.html']);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && (page === 'login.html' || page === 'registration.html' || page === 'index.html')) {
    location.replace('home.html'); return;
  }
  if (!user && !PUBLIC.has(page)) { location.replace('login.html'); return; }
  if (user) {
    const btns = document.querySelector('.buttons');
    if (btns) btns.innerHTML = `<span class="me-2">Hi, ${user.name || 'User'}</span>
      <button id="logoutBtn" class="btn btn-outline-danger">Logout</button>`;
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'logoutBtn') {
        localStorage.removeItem('user'); location.replace('login.html');
      }
    });
  }
})();