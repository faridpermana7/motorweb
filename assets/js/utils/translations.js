// Navigation menu utility, This file contains the shared navigation menu HTML and insertion logic
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from './api.js';

let translations = {};

export async function loadTranslations() {

  await configReady; // Ensure config is loaded before fetching translations
  
  try {
    
    // Load configurations from localStorage
    const configs = JSON.parse(localStorage.getItem("configurations") || "{}");

    // Only proceed if Application_language_indonesia is true
    if (configs["Application_language_indonesia"] !== "true") {
      console.log("Skipping translations: Application_language_indonesia is not enabled");
      return;
    }
    // First check localStorage
    const cached = localStorage.getItem("translations");
    if (cached) {
      translations = JSON.parse(cached);
      console.log("Translations loaded from localStorage:", translations);
      return;
    }

    // If not cached, fetch from API
    const data = await apiFetch(`${API_BASE_URL}/phrases`);
    console.log("Translations loaded from API:", data);

    translations = data.reduce((acc, row) => {
      acc[row.phrase] = row.translation;
      return acc;
    }, {});
    // Save to localStorage
    localStorage.setItem("translations", JSON.stringify(translations));
  } catch (err) {
    console.error('Failed to load translations:', err);
  }
  
}

export function t(phaseKey) {
  return translations[phaseKey] || phaseKey; //fallback to key if translation not found
}

// Apply translations to DOM elements (scoped)
export function applyTranslations(scope = document) {
  scope.querySelectorAll("[data-phrase]").forEach(el => {
    const key = el.getAttribute("data-phrase");
    const translated = t(key);

    // Handle placeholder attribute
    if (el.hasAttribute("placeholder")) {
      el.setAttribute("placeholder", translated || key);
      return;
    }
    
    // If element has no text nodes, inject translation or fallback
    const hasTextNode = Array.from(el.childNodes).some(
      node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ""
    );

    if (!hasTextNode) {
      el.textContent = translated; // fallback to translation or key
    } else {
      // Replace existing text nodes only
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = translated;
        }
      });
    }
  });
}

// export function applyTranslations() {
//   document.querySelectorAll('[data-phrase]').forEach(el => {
//     const key = el.getAttribute('data-phrase');
//     const translated = t(key);

//     // Replace only text nodes, keep child elements intact
//     el.childNodes.forEach(node => {
//       if (node.nodeType === Node.TEXT_NODE) {
//         node.nodeValue = translated;
//       }
//     });
//   });
// }


// export function applyTranslations() {
//   // Translate visible headers
//   document.querySelectorAll('.dataTables_scrollHead [data-phrase]').forEach(el => {
//     const key = el.getAttribute('data-phrase');
//     const translated = t(key);
//     el.childNodes.forEach(node => {
//       if (node.nodeType === Node.TEXT_NODE) node.nodeValue = translated;
//     });
//   });

//   // Translate filter, paginate, info, etc.
//   document.querySelectorAll(
//     '#transactionsTable_filter [data-phrase], #transactionsTable_length [data-phrase], #transactionsTable_info[data-phrase], #transactionsTable_paginate [data-phrase]'
//   ).forEach(el => {
//     const key = el.getAttribute('data-phrase');
//     const translated = t(key);
//     el.childNodes.forEach(node => {
//       if (node.nodeType === Node.TEXT_NODE) node.nodeValue = translated;
//     });
//   });
// }
