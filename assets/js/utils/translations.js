// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from './api.js';
let translations = {};

function normalizePhraseKey(phrase) {
  return (phrase || "").toString().toLowerCase().trim();
}

function isIndonesianLanguage(language) {
  const normalized = (language || "").toString().toLowerCase().trim().replace(/_/g, "-");
  return normalized === "id" ||
    normalized.startsWith("id-") ||
    normalized.startsWith("indonesia") ||
    normalized.startsWith("indonesian") ||
    normalized.startsWith("bahasa indonesia");
}

function normalizeTranslationMap(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return Object.keys(source).reduce((acc, phrase) => {
    const key = normalizePhraseKey(phrase);
    if (key && typeof source[phrase] === "string" && source[phrase].trim()) {
      acc[key] = source[phrase];
    }
    return acc;
  }, {});
}

// Refresh translations from the selected language, using a verified cache only if offline.
export async function loadTranslations() {
  await configReady;

  let cachedTranslations = {};
  translations = {};

  try {
    const configs = JSON.parse(localStorage.getItem("configurations") || "{}");
    if (String(configs["Application_language_indonesia"]).toLowerCase() !== "true") {
      translations = {};
      console.log("Skipping translations: Application_language_indonesia is not enabled");
      return;
    }

    if (localStorage.getItem("translations_language") === "id") {
      const cached = localStorage.getItem("translations");
      if (cached) {
        try {
          cachedTranslations = normalizeTranslationMap(JSON.parse(cached));
        } catch (err) {
          console.warn("Ignoring invalid cached translations.", err);
        }
      }
    }

    const data = await apiFetch(`${API_BASE_URL}/phrases`);
    if (!Array.isArray(data)) {
      throw new TypeError("Unexpected phrases response format");
    }

    translations = data.reduce((acc, row) => {
      const language = (row.language || "").toString().trim();
      if (language && !isIndonesianLanguage(language)) {
        return acc;
      }

      const phraseKey = normalizePhraseKey(row.phrase);
      const translation = (row.translation || "").toString().trim();
      if (phraseKey && translation) {
        acc[phraseKey] = translation;
      }
      return acc;
    }, {});

    console.log("Indonesian translations loaded from API:", translations);
    localStorage.setItem("translations", JSON.stringify(translations));
    localStorage.setItem("translations_language", "id");
  } catch (err) {
    if (Object.keys(cachedTranslations).length) {
      translations = cachedTranslations;
      console.warn("Unable to refresh Indonesian translations; using the verified cache.", err);
    } else {
      console.error('Failed to load translations:', err);
    }
  }
}

// Lookup helper: case-insensitive, trims whitespace
export function t(phraseKey) {
  if (!phraseKey && phraseKey !== "") return phraseKey;
  const lookup = normalizePhraseKey(phraseKey);
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

    const translated = t(rawKey);

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
