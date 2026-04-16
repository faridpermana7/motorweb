// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
import { API_BASE_URL, configReady } from '../config.js';

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
              <a class="nav-link text-dark" href="${BASE_PATH}pages/master/items.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> Items </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/master/enum_tables.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> Enum Tables </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/master/locations.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> Locations </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/master/xxx.html">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> XXX </span>
              </a>
            </li> 
            <li class="nav-item">
              <a class="nav-link text-dark" data-bs-toggle="collapse" aria-expanded="false" href="#xxxExamples">
                <span class="sidenav-mini-icon"> M </span>
                <span class="sidenav-normal ms-1 ps-1"> XXX <b class="caret"></b></span>
              </a>
              <div class="collapse" id="xxxExamples">
                <ul class="nav nav-sm flex-column">
                  <li class="nav-item">
                    <a class="nav-link text-dark" href="${BASE_PATH}pages/master/xxx/xxx-categories.html">
                      <span class="sidenav-mini-icon"> I </span>
                      <span class="sidenav-normal ms-1 ps-1"> XXX Categories </span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link text-dark" href="${BASE_PATH}pages/master/xxx/xxx-types.html">
                      <span class="sidenav-mini-icon"> I </span>
                      <span class="sidenav-normal ms-1 ps-1"> XXX Types </span>
                    </a>
                  </li>
                </ul>
              </div>
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
              <a class="nav-link text-dark" href="${BASE_PATH}pages/admin/users.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> User </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/admin/logins.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> Logins </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/admin/configurations.html">
                <span class="sidenav-mini-icon"> A </span>
                <span class="sidenav-normal ms-1 ps-1"> Configuration </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-dark" href="${BASE_PATH}pages/admin/phrases.html">
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
        <a id="logout-link" class="nav-link text-dark" href="${BASE_PATH}pages/sign-in.html">
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
  attachLogoutHandler(sidenav);
}

function getTopNavbarHTML(pageTitle = '') {
  const title = pageTitle || 'Page';

  return `
    <nav class="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl" id="navbarBlur" data-scroll="true">
      <div class="container-fluid py-1 px-3">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
            <li class="breadcrumb-item text-sm"><a class="opacity-5 text-dark" href="javascript:;">Pages</a></li>
            <li class="breadcrumb-item text-sm text-dark active" aria-current="page">${title}</li>
          </ol>
        </nav>
        <div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div class="ms-md-auto pe-md-3 d-flex align-items-center">
            <div class="input-group input-group-outline">
              <label class="form-label">Type here...</label>
              <input type="text" class="form-control">
            </div>
          </div>
          <ul class="navbar-nav d-flex align-items-center  justify-content-end">
            <li class="nav-item d-flex align-items-center">
              <a class="btn btn-outline-primary btn-sm mb-0 me-3" target="_blank" href="">Online Builder</a>
            </li>
            <li class="mt-1">
              <a class="github-button" href="" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star creativetimofficial/material-dashboard on GitHub">Star</a>
            </li>
            <li class="nav-item d-xl-none ps-3 d-flex align-items-center">
              <a href="javascript:;" class="nav-link text-body p-0" id="iconNavbarSidenav">
                <div class="sidenav-toggler-inner">
                  <i class="sidenav-toggler-line"></i>
                  <i class="sidenav-toggler-line"></i>
                  <i class="sidenav-toggler-line"></i>
                </div>
              </a>
            </li>
            <li class="nav-item px-3 d-flex align-items-center">
              <a href="javascript:;" class="nav-link text-body p-0">
                <i class="material-symbols-rounded fixed-plugin-button-nav">settings</i>
              </a>
            </li>
            <li class="nav-item dropdown pe-3 d-flex align-items-center">
              <a href="javascript:;" class="nav-link text-body p-0" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="material-symbols-rounded">notifications</i>
              </a>
              <ul class="dropdown-menu  dropdown-menu-end  px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton">
                <li class="mb-2">
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="d-flex py-1">
                      <div class="my-auto">
                        <img src="${BASE_PATH}assets/img/team-2.jpg" class="avatar avatar-sm  me-3 ">
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="text-sm font-weight-normal mb-1">
                          <span class="font-weight-bold">New message</span> from Laur
                        </h6>
                        <p class="text-xs text-secondary mb-0">
                          <i class="fa fa-clock me-1"></i>   
                          13 minutes ago
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
                <li class="mb-2">
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="d-flex py-1">
                      <div class="my-auto">
                        <img src="${BASE_PATH}assets/img/small-logos/logo-spotify.svg" class="avatar avatar-sm bg-gradient-dark  me-3 ">
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="text-sm font-weight-normal mb-1">
                          <span class="font-weight-bold">New album</span> by Travis Scott
                        </h6>
                        <p class="text-xs text-secondary mb-0">
                          <i class="fa fa-clock me-1"></i>
                          1 day
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item border-radius-md" href="javascript:;">
                    <div class="d-flex py-1">
                      <div class="avatar avatar-sm bg-gradient-secondary  me-3  my-auto">
                        <svg width="12px" height="12px" viewBox="0 0 43 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                          <title>credit-card</title>
                          <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g transform="translate(-2169.000000, -745.000000)" fill="#FFFFFF" fill-rule="nonzero">
                              <g transform="translate(1716.000000, 291.000000)">
                                <g transform="translate(453.000000, 454.000000)">
                                  <path class="color-background" d="M43,10.7482083 L43,3.58333333 C43,1.60354167 41.3964583,0 39.4166667,0 L3.58333333,0 C1.60354167,0 0,1.60354167 0,3.58333333 L0,10.7482083 L43,10.7482083 Z" opacity="0.593633743"></path>
                                  <path class="color-background" d="M0,16.125 L0,32.25 C0,34.2297917 1.60354167,35.8333333 3.58333333,35.8333333 L39.4166667,35.8333333 C41.3964583,35.8333333 43,34.2297917 43,32.25 L43,16.125 L0,16.125 Z M19.7083333,26.875 L7.16666667,26.875 L7.16666667,23.2916667 L19.7083333,23.2916667 L19.7083333,26.875 Z M35.8333333,26.875 L28.6666667,26.875 L28.6666667,23.2916667 L35.8333333,23.2916667 L35.8333333,26.875 Z"></path>
                                </g>
                              </g>
                            </g>
                          </g>
                        </svg>
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="text-sm font-weight-normal mb-1">
                          Payment successfully completed
                        </h6>
                        <p class="text-xs text-secondary mb-0">
                          <i class="fa fa-clock me-1"></i>
                          2 days
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </li>
            <li class="nav-item d-flex align-items-center">
              <a href="../../pages/profile.html" class="nav-link text-body font-weight-bold px-0">
                <i class="material-symbols-rounded">account_circle</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}

function loadPageHeader(pageTitle, containerSelector = '#top-navbar') {
  const headerContainer = document.querySelector(containerSelector);
  if (!headerContainer) {
    return;
  }

  headerContainer.innerHTML = getTopNavbarHTML(pageTitle);
}

function getFooterHTML() {
  return `
    <footer class="footer">
      <div class="container-fluid">
        <div class="row align-items-center justify-content-lg-between">
          <div class="col-lg-12 mb-lg-0 mb-4">
            <div class="copyright text-center text-sm text-muted text-lg-start">
              © 2026,
              made with <i class="fa fa-heart"></i> by
              <a href="" class="font-weight-bold" target="_blank">pfar</a>
              for a better web.
            </div>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function loadFooter(containerSelector = '#page-footer') {
  const footerContainer = document.querySelector(containerSelector);
  if (!footerContainer) {
    return;
  }

  footerContainer.innerHTML = getFooterHTML();
}

function attachLogoutHandler(sidenav) {
  const logoutLink = sidenav.querySelector('#logout-link');
  if (!logoutLink) {
    return;
  }

  logoutLink.addEventListener('click', async event => {
    event.preventDefault();
    await handleLogout();
  });
}

// function getLogoutEndpoint() {
//   if (!window.AUTH_LOGOUT_ENDPOINT) {
//     return null;
//   }

//   const endpoint = window.AUTH_LOGOUT_ENDPOINT;
//   return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
// }

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  window.location.href = `${BASE_PATH}pages/sign-in.html`;
}

async function performLogoutRequest(logoutUrl) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(logoutUrl, {
    method: 'POST',
    headers,
    mode: 'cors',
    credentials: 'include'
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Logout request failed with status ${response.status}`);
  }

  return response.json().catch(() => null);
}

async function handleLogout() {
  if (!API_BASE_URL) 
    await configReady; 
  
  const logoutUrl = `${API_BASE_URL}/auth/logout`;

  const invalidLocalPattern = '127.0.0.1:8080';
  if (logoutUrl.includes(invalidLocalPattern) || logoutUrl.startsWith(window.location.origin)) {
    console.error('Invalid logout URL detected; aborting logout to avoid bad API call.', logoutUrl);
    return;
  }

  try {
    await performLogoutRequest(logoutUrl);
    clearSessionAndRedirect();
  } catch (error) {
    console.warn('Logout API request failed:', error);
  }
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

export { loadNavMenu, loadPageHeader, loadFooter, setActiveNavLink, activateNavLink };