// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from './api.js';
let translations = {};

// Load translations (normalizes keys to lowercase)
export async function loadTranslations() {
  await configReady;

  try {
    const configs = JSON.parse(localStorage.getItem("configurations") || "{}");
    if (configs["Application_language_indonesia"] !== "true") {
      console.log("Skipping translations: Application_language_indonesia is not enabled");
      return;
    }

    const cached = localStorage.getItem("translations");
    if (cached) {
      // cached should already be normalized, but normalize again to be safe
      const parsed = JSON.parse(cached);
      translations = Object.keys(parsed).reduce((acc, k) => {
        acc[k.toLowerCase().trim()] = parsed[k];
        return acc;
      }, {});
      console.log("Translations loaded from localStorage:", translations);
      return;
    }

    const data = await apiFetch(`${API_BASE_URL}/phrases`);
    console.log("Translations loaded from API:", data);

    // Normalize phrase keys to lowercase + trim
    translations = data.reduce((acc, row) => {
      const phraseKey = (row.phrase || "").toString().toLowerCase().trim();
      acc[phraseKey] = row.translation;
      return acc;
    }, {});

    localStorage.setItem("translations", JSON.stringify(translations));
  } catch (err) {
    console.error('Failed to load translations:', err);
  }
}

// Lookup helper: case-insensitive, trims whitespace
export function t(phraseKey) {
  if (!phraseKey && phraseKey !== "") return phraseKey;
  const lookup = phraseKey.toString().toLowerCase().trim();
  return translations[lookup] || phraseKey;
}

// Apply translations to DOM elements (scoped)
export function applyTranslations(scope = document) {
  if (!scope) {
    console.warn('applyTranslations called with null or undefined scope — skipping translations.', {
      scope,
      stack: (new Error()).stack
    });
    return;
  }

  if (typeof scope.querySelectorAll !== 'function') {
    console.warn('applyTranslations: scope does not support querySelectorAll — skipping.', {
      scope,
      type: Object.prototype.toString.call(scope),
      stack: (new Error()).stack
    });
    return;
  }

  scope.querySelectorAll("[data-phrase]").forEach(el => {
    const rawKey = el.getAttribute("data-phrase");
    if (!rawKey) return;

    // Normalize the key for lookup but keep rawKey for fallback if needed
    const normalizedKey = rawKey.toString().toLowerCase().trim();
    const translated = t(normalizedKey);

    // Handle placeholder attribute
    if (el.hasAttribute("placeholder")) {
      el.setAttribute("placeholder", translated || rawKey);
      return;
    }

    // If element has no text nodes, inject translation or fallback
    const hasTextNode = Array.from(el.childNodes).some(
      node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ""
    );

    if (!hasTextNode) {
      el.textContent = translated || rawKey;
    } else {
      // Replace existing text nodes only
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = translated || rawKey;
        }
      });
    }
  });
}
