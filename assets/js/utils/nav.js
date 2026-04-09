// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
const BASE_PATH = window.location.origin + "/";

const navHTML = `
  <div class="sidenav-header">
    <i class="fas fa-times p-3 cursor-pointer text-dark opacity-5 position-absolute end-0 top-0 d-none d-xl-none" aria-hidden="true" id="iconSidenav"></i>
    <a class="navbar-brand px-4 py-3 m-0" href="${BASE_PATH}pages/dashboard.html">
      <img src="${BASE_PATH}assets/img/logo-ct-dark.png" class="navbar-brand-img" width="26" height="26" alt="main_logo">
      <span class="ms-1 text-sm text-dark">Motor</span>
    </a>
  </div>
  <hr class="horizontal dark mt-0 mb-2">
  <div class="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
    <ul class="navbar-nav">
      <li class="nav-item">
        <a class="nav-link active bg-gradient-dark text-white" href="${BASE_PATH}pages/dashboard.html">
          <i class="material-symbols-rounded opacity-5">dashboard</i>
          <span class="nav-link-text ms-1">Dashboard</span>
        </a>
      </li>
      <li class="nav-item">
        <a data-bs-toggle="collapse" href="#masterExamples" class="nav-link text-dark" aria-controls="masterExamples" role="button" aria-expanded="false">
          <i class="material-symbols-rounded opacity-5">contract</i>
          <span class="nav-link-text ms-1 ps-1">Master</span>
        </a>
        <div class="collapse" id="masterExamples">
          <ul class="nav">
            <li class="nav-item">
              <a class="nav-link text-dark" data-bs-toggle="collapse" aria-expanded="false" href="#itemExamples">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> Items <b class="caret"></b></span>
              </a>
              <div class="collapse" id="itemExamples">
                <ul class="nav nav-sm flex-column">
                  <li class="nav-item">
                    <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/vr/vr-default.html">
                      <span class="sidenav-mini-icon"> I </span>
                      <span class="sidenav-normal ms-1 ps-1"> Item Categories </span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/vr/vr-info.html">
                      <span class="sidenav-mini-icon"> I </span>
                      <span class="sidenav-normal ms-1 ps-1"> Item Types </span>
                    </a>
                  </li>
                </ul>
              </div>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/master/locations.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> Locations </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/rtl-page.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> XXX </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/widgets.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> XXX </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/charts.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> XXX </span>
              </a>
            </li>
          </ul>
        </div>
      </li>
      <li class="nav-item">
        <a data-bs-toggle="collapse" href="#adminExamples" class="nav-link text-dark" aria-controls="adminExamples" role="button" aria-expanded="false">
          <i class="material-symbols-rounded opacity-5">contract</i>
          <span class="nav-link-text ms-1 ps-1">Admin</span>
        </a>
        <div class="collapse" id="adminExamples">
          <ul class="nav">
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/pricing-page.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> User </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/rtl-page.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> Logins </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/widgets.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> Configuration </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}admin/admin/charts.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> Translation </span>
              </a>
            </li>
          </ul>
        </div>
      </li>
      <li class="nav-item">
        <a class="nav-link text-dark" href="${BASE_PATH}pages/billing.html">
          <i class="material-symbols-rounded opacity-5">receipt_long</i>
          <span class="nav-link-text ms-1">Billing</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link text-dark" href="${BASE_PATH}pages/notifications.html">
          <i class="material-symbols-rounded opacity-5">notifications</i>
          <span class="nav-link-text ms-1">Notifications</span>
        </a>
      </li>
      <li class="nav-item mt-3">
        <h6 class="ps-4 ms-2 text-uppercase text-xs text-dark font-weight-bolder opacity-5">Account pages</h6>
      </li>
      <li class="nav-item">
        <a class="nav-link text-dark" href="${BASE_PATH}pages/profile.html">
          <i class="material-symbols-rounded opacity-5">person</i>
          <span class="nav-link-text ms-1">Profile</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link text-dark" href="${BASE_PATH}pages/sign-in.html">
          <i class="material-symbols-rounded opacity-5">logout</i>
          <span class="nav-link-text ms-1">Log Out</span>
        </a>
      </li>
    </ul>
  </div>
`;

function loadNavMenu(containerSelector = '#sidenav-main') {
  const sidenav = document.querySelector(containerSelector);
  if (!sidenav) {
    return;
  }

  sidenav.innerHTML = navHTML;
  setActiveNavLink(sidenav);
}

function setActiveNavLink(sidenav) {
  const currentPath = window.location.pathname.replace(/\/+$|^\/|\/{2,}/g, '/');
  const links = sidenav.querySelectorAll('a.nav-link[href]');

  links.forEach(link => {
    link.classList.remove('active', 'bg-gradient-dark', 'text-white');
    if (!link.classList.contains('text-dark')) {
      link.classList.add('text-dark');
    }
  });

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('#')) {
      return;
    }

    try {
      const linkUrl = new URL(href, window.location.href);
      const linkPath = linkUrl.pathname.replace(/\/+$|^\/|\/{2,}/g, '/');

      if (linkPath === currentPath) {
        activateNavLink(link);
      }
    } catch (error) {
      console.warn('Nav link URL parse failed:', href, error);
    }
  });
}

function activateNavLink(link) {
  link.classList.add('active', 'bg-gradient-dark', 'text-white');
  link.classList.remove('text-dark');

  const parentCollapse = link.closest('.collapse');
  if (parentCollapse) {
    parentCollapse.classList.add('show');
    const toggle = document.querySelector(`[href="#${parentCollapse.id}"]`);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
  }
}

// Make it global
window.loadNavMenu = loadNavMenu;
window.setActiveNavLink = setActiveNavLink;
window.activateNavLink = activateNavLink;