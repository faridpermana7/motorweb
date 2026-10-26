// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
import { API_BASE_URL, configReady } from '../config.js';
import { applyTranslations } from './translations.js';

const BASE_PATH = window.location.origin + "/";
const STOCK_UPDATE_STORAGE_KEY = 'motorweb-stock-updated-at';
let stockNotificationInterval;
let stockNotificationRequest;
let stockNotificationListenersReady = false;

function renderStockNotifications(items) {
  const list = document.getElementById('stockNotifications');
  const count = document.getElementById('stockNotificationCount');
  if (!list || !count) return;

  count.textContent = String(items.length);
  count.classList.toggle('d-none', items.length === 0);
  list.replaceChildren();

  if (!items.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'px-3 py-2 text-sm text-secondary';
    emptyItem.textContent = 'No items at or below minimum stock.';
    list.appendChild(emptyItem);
    return;
  }

  const summaryItem = document.createElement('li');
  summaryItem.className = 'px-3 pb-2 text-xs text-secondary';
  summaryItem.textContent = `${items.length} item(s) at or below minimum stock`;
  list.appendChild(summaryItem);

  items.forEach(item => {
    const listItem = document.createElement('li');
    listItem.className = 'mb-2';

    const link = document.createElement('a');
    link.className = 'dropdown-item border-radius-md';
    link.href = `${BASE_PATH}pages/master/items.html?edit=${encodeURIComponent(String(item.id))}`;

    const row = document.createElement('div');
    row.className = 'd-flex align-items-center py-1';

    const icon = document.createElement('span');
    icon.className = `avatar avatar-sm ${item.stock < item.minimumStock ? 'bg-gradient-danger' : 'bg-gradient-warning'} me-3 my-auto`;
    icon.textContent = item.stock < item.minimumStock ? '!' : '↓';

    const content = document.createElement('div');
    content.className = 'd-flex flex-column justify-content-center';

    const name = document.createElement('h6');
    name.className = 'text-sm font-weight-normal mb-1';
    name.textContent = String(item.name || item.code || `Item ${item.id}`);

    const detail = document.createElement('p');
    detail.className = 'text-xs text-secondary mb-0';
    detail.textContent = `${item.stock} in stock · minimum ${item.minimumStock}`;

    content.append(name, detail);
    row.append(icon, content);
    link.appendChild(row);
    listItem.appendChild(link);
    list.appendChild(listItem);
  });

  const reportItem = document.createElement('li');
  const reportLink = document.createElement('a');
  reportLink.className = 'dropdown-item text-center text-sm font-weight-bold';
  reportLink.href = `${BASE_PATH}pages/report/stocks.html`;
  reportLink.textContent = 'View stock report';
  reportItem.appendChild(reportLink);
  list.appendChild(reportItem);
}

async function refreshStockNotifications() {
  if (stockNotificationRequest) return stockNotificationRequest;

  stockNotificationRequest = (async () => {
    try {
      if (!API_BASE_URL) await configReady;
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/items/stocks`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Unable to refresh stock notifications (HTTP ${response.status}).`);
      }

      const items = await response.json();
      if (!Array.isArray(items)) {
        throw new TypeError('Unexpected stock notification response format.');
      }

      const lowStockItems = items
        .map(item => ({
          ...item,
          stock: Number(item.stock),
          minimumStock: Number(item.minimum_stock)
        }))
        .filter(item =>
          item.id != null &&
          Number.isFinite(item.stock) &&
          Number.isFinite(item.minimumStock) &&
          item.stock <= item.minimumStock
        )
        .sort((left, right) =>
          (left.stock - left.minimumStock) - (right.stock - right.minimumStock) ||
          String(left.name || '').localeCompare(String(right.name || ''))
        );

      renderStockNotifications(lowStockItems);
    } catch (error) {
      console.error('Failed to refresh stock notifications:', error);
      const list = document.getElementById('stockNotifications');
      if (list && !list.children.length) {
        const errorItem = document.createElement('li');
        errorItem.className = 'px-3 py-2 text-sm text-danger';
        errorItem.textContent = 'Unable to load stock notifications.';
        list.appendChild(errorItem);
      }
    } finally {
      stockNotificationRequest = null;
    }
  })();

  return stockNotificationRequest;
}

function initializeStockNotifications() {
  const button = document.getElementById('dropdownMenuButton');
  if (!button) return;

  const dropdown = button.closest('.dropdown');
  let list = document.getElementById('stockNotifications');
  if (!list && dropdown) {
    list = dropdown.querySelector('.dropdown-menu');
    if (list) list.id = 'stockNotifications';
  }
  if (!list) {
    list = document.createElement('ul');
    list.className = 'dropdown-menu dropdown-menu-end px-2 py-3';
    list.id = 'stockNotifications';
    dropdown?.appendChild(list);
  }
  list.setAttribute('aria-labelledby', button.id);
  list.style.maxHeight = '70vh';
  list.style.minWidth = '18rem';
  list.style.overflowY = 'auto';

  if (!document.getElementById('stockNotificationCount')) {
    const count = document.createElement('span');
    count.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-gradient-danger d-none';
    count.id = 'stockNotificationCount';
    count.textContent = '0';
    button.classList.add('position-relative');
    button.appendChild(count);
  }

  if (button.dataset.stockNotificationsBound !== 'true') {
    button.addEventListener('click', refreshStockNotifications);
    button.dataset.stockNotificationsBound = 'true';
  }

  if (!stockNotificationListenersReady) {
    window.addEventListener('focus', refreshStockNotifications);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshStockNotifications();
    });
    window.addEventListener('storage', event => {
      if (event.key === STOCK_UPDATE_STORAGE_KEY) refreshStockNotifications();
    });
    window.addEventListener('stock-data-updated', refreshStockNotifications);
    stockNotificationListenersReady = true;
  }

  clearInterval(stockNotificationInterval);
  stockNotificationInterval = setInterval(refreshStockNotifications, 30000);
  refreshStockNotifications();
}

function publishStockUpdate() {
  window.dispatchEvent(new Event('stock-data-updated'));
  try {
    localStorage.setItem(STOCK_UPDATE_STORAGE_KEY, String(Date.now()));
  } catch (error) {
    console.warn('Could not notify other tabs about the stock update:', error);
  }
}

function renderMenu(menuItems, basePath) {
  return menuItems
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(item => {
    if (item.children && item.children.length > 0) {
      // Parent menu with collapsible children
      const collapseId = `${item.label.replace(/\s+/g, '')}Examples`;
      return `
        <li class="nav-item">
          <a data-bs-toggle="collapse" href="#${collapseId}" class="nav-link text-dark" aria-controls="${collapseId}" role="button" aria-expanded="false">
            <i class="material-symbols-rounded opacity-5">${item.icon || 'menu'}</i>
            <span class="nav-link-text ms-1 ps-1" data-phrase="${item.label}">${item.label}</span>
          </a>
          <div class="collapse" id="${collapseId}">
            <ul class="nav">
              ${renderMenu(item.children, basePath)}
            </ul>
          </div>
        </li>
      `;
    } else {
      let menuli = '';
      if (item.label === 'Profile') {
        // add sparator before account pages 
        menuli = `<li class="nav-item mt-3">
          <h6 class="ps-4 ms-2 text-uppercase text-xs text-dark font-weight-bolder opacity-5">Account pages</h6>
        </li>`;
        }
      // Leaf menu
      menuli += `
        <li class="nav-item">
          <a class="nav-link text-dark" href="${basePath}${item.path}" ${item.icon === 'logout' ? 'id="logout-link"' : ''}>
            <i class="material-symbols-rounded opacity-5">${item.icon || ''}</i>
            <span class="nav-link-text ms-1" data-phrase="${item.label}">${item.label}</span>
          </a>
        </li>
      `;
      return menuli;

    }
  }).join('');
}


function loadNavMenu(containerSelector = '#sidenav-main') {
  const sidenav = document.querySelector(containerSelector);
  if (!sidenav) {
    return;
  }

  const menus = JSON.parse(localStorage.getItem("menus")) || [];
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
        ${renderMenu(menus, BASE_PATH)}
      </ul>
    </div>
  `;
  sidenav.innerHTML = navHTML;
  applyTranslations(sidenav);
  setActiveNavLink(sidenav);
  attachLogoutHandler(sidenav);
  initializeStockNotifications();
}

function getTopNavbarHTML(pageTitle = '') {
  const title = pageTitle || 'Page';

  return `
    <nav class="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl" id="navbarBlur" data-scroll="true">
      <div class="container-fluid py-1 px-3">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
            <li class="breadcrumb-item text-sm"><a class="opacity-5 text-dark" href="javascript:;" data-phrase="Pages">Pages</a></li>
            <li class="breadcrumb-item text-sm text-dark active" aria-current="page" data-phrase="${title}">${title}</li>
          </ol>
        </nav>
        <div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div class="ms-md-auto pe-md-3 d-flex align-items-center"> 
          </div>
          <ul class="navbar-nav d-flex align-items-center  justify-content-end"> 
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
              <a href="javascript:;" class="nav-link text-body p-0 position-relative" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Stock notifications">
                <i class="material-symbols-rounded">notifications</i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-gradient-danger d-none" id="stockNotificationCount">0</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton" id="stockNotifications" style="max-height: 70vh; min-width: 18rem; overflow-y: auto;">
                <li class="px-3 py-2 text-sm text-secondary">Loading stock notifications...</li>
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
  applyTranslations(headerContainer);
  initializeStockNotifications();
}

function getFooterHTML() {
  return ``;
  // return `
  //   <footer class="footer">
  //     <div class="container-fluid">
  //       <div class="row align-items-center justify-content-lg-between">
  //         <div class="col-lg-12 mb-lg-0 mb-4">
  //           <div class="copyright text-center text-sm text-muted text-lg-start">
  //             © 2026,
  //             made with <i class="fa fa-heart"></i> by
  //             <a href="" class="font-weight-bold" target="_blank">pfar</a>
  //             for a better web.
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </footer>
  // `;
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
  localStorage.removeItem('translations');
  localStorage.removeItem('translations_language');
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

export {
  loadNavMenu,
  loadPageHeader,
  loadFooter,
  setActiveNavLink,
  activateNavLink,
  publishStockUpdate,
  refreshStockNotifications
};