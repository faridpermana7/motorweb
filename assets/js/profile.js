"use strict";
import { API_BASE_URL, configReady } from './config.js';
import { apiFetch } from './utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from './utils/nav.js';

(function() {
  const ui = {
    loading: document.getElementById('profileLoading'),
    error: document.getElementById('profileError'),
    details: document.getElementById('profileDetails'),
    name: document.getElementById('profileName'),
    subtitle: document.getElementById('profileSubtitle')
  };

  function getTokenUserId() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const claims = JSON.parse(new TextDecoder().decode(
        Uint8Array.from(atob(padded), character => character.charCodeAt(0))
      ));
      return findUserId(claims);
    } catch (error) {
      console.warn('Could not read a user ID from the access token.', error);
      return null;
    }
  }

  function findUserId(value) {
    if (!value || typeof value !== 'object') return null;

    for (const key of ['user_id', 'id', 'sub']) {
      const candidate = value[key];
      if ((typeof candidate === 'string' || typeof candidate === 'number') &&
          String(candidate).trim()) {
        return String(candidate);
      }
    }

    for (const key of ['user', 'data', 'current_user']) {
      const nestedId = findUserId(value[key]);
      if (nestedId) return nestedId;
    }
    return null;
  }

  function getDisplayValue(value) {
    if (value == null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function getDisplayLabel(key) {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function renderUser(user) {
    const details = user?.data && typeof user.data === 'object' && !Array.isArray(user.data)
      ? user.data
      : user?.user && typeof user.user === 'object' && !Array.isArray(user.user)
        ? user.user
        : user;

    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      throw new TypeError('Unexpected user response format.');
    }

    const fields = Object.entries(details).filter(([key]) =>
      !/password|token|secret|credential|(^|_)hash($|_)/i.test(key)
    );
    if (!fields.length) {
      throw new Error('No displayable account information was returned.');
    }

    ui.details.replaceChildren();
    fields.forEach(([key, value]) => {
      const column = document.createElement('div');
      column.className = 'col-12 col-md-6';

      const label = document.createElement('label');
      label.className = 'form-label text-sm';
      label.textContent = getDisplayLabel(key);

      const input = document.createElement('input');
      input.className = 'form-control';
      input.type = 'text';
      input.value = getDisplayValue(value);
      input.disabled = true;
      input.readOnly = true;
      input.title = 'Ask your administrator to change this information.';

      column.append(label, input);
      ui.details.appendChild(column);
    });

    const displayName = details.full_name || details.name || details.username || details.email;
    if (displayName) ui.name.textContent = String(displayName);
    ui.subtitle.textContent = details.role_name
      ? `Account details · ${details.role_name}`
      : 'Your account information';
  }

  async function loadProfile() {
    ui.loading.classList.remove('d-none');
    ui.error.classList.add('d-none');

    const currentUser = await apiFetch(`${API_BASE_URL}/auth/me`);
    const userId = findUserId(currentUser) || getTokenUserId();
    if (!userId) {
      throw new Error('Could not determine the signed-in user ID.');
    }

    const user = await apiFetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}`);
    renderUser(user);
  }

  async function initProfile() {
    try {
      if (!API_BASE_URL) await configReady;
      loadNavMenu();
      loadPageHeader('Profile');
      loadFooter();
      await loadProfile();
    } catch (error) {
      console.error('Failed to load profile:', error);
      ui.error.textContent = error.message || 'Unable to load your account information.';
      ui.error.classList.remove('d-none');
      window.showAlert(error.message || 'Unable to load your account information.', 'danger');
    } finally {
      ui.loading.classList.add('d-none');
    }
  }

  if (window.appReady !== undefined) {
    initProfile();
  } else {
    window.addEventListener('appReady', initProfile, { once: true });
  }
})();
