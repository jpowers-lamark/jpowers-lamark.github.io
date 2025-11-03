(() => {
  const cfg = window.ASSESSMENT_CONFIG;
  const q = sel => document.querySelector(sel);

  function setActiveLink() {
    const path = getPath();
    document.querySelectorAll('a[data-route]').forEach(a => {
      const href = a.getAttribute('href').replace('#','');
      a.classList.toggle('active', href === path || (path==="/" && href===""));
    });
  }

  function getPath() {
    const hash = location.hash.replace(/^#/, "");
    return hash || "/"; // default home
  }

  async function loadView() {
    const path = getPath();
    setActiveLink();
    const file = cfg.ROUTES[path];
    const view = q('#view');

    if (!file) {
      view.innerHTML = `<section><h2>Not Found</h2><p>This route does not exist.</p></section>`;
      return;
    }

    try {
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const html = await res.text();
      view.innerHTML = html;
      view.focus();
    } catch(e) {
      view.innerHTML = `<section><h2>Error loading content</h2><p>Could not load ${file}.</p></section>`;
    }
  }

  function loggedIn() {
    return sessionStorage.getItem("assessment_auth") === "ok";
  }
  function unlock() {
    q('#gate').remove();
    q('#shell').style.display = "block";
    loadView();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const u = q('#user').value.trim();
    const p = q('#pass').value;
    const err = q('#err');

    if (u !== cfg.USERNAME || p !== cfg.PASSWORD) {
      err.textContent = "Invalid credentials";
      return;
    }
    sessionStorage.setItem("assessment_auth","ok");
    unlock();
  }

  window.addEventListener('load', () => {
    // Wire login
    q('#gateForm').addEventListener('submit', handleLogin);

    // Already authed this tab?
    if (loggedIn()) unlock();

    // Router
    window.addEventListener('hashchange', loadView);
  });
})();
