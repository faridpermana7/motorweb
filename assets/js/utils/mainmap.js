"use strict";

let currentMap = null;

function initMap(containerId, coords = [0, 0], zoom = 12) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Map container not found: ${containerId}`);
    }

    if (!currentMap) {
        currentMap = L.map(containerId).setView(coords, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            maxNativeZoom: 19
        }).addTo(currentMap);
    } else {
        currentMap.setView(coords, zoom);
    }

    return currentMap;
}

function clearMapMarkers() {
    if (!currentMap) return;

    currentMap.eachLayer(layer => {
        if (!(layer instanceof L.TileLayer)) {
            currentMap.removeLayer(layer);
        }
    });
}

function addMarker(coords, popupHtml) {
    if (!currentMap) {
        throw new Error('Map has not been initialized. Call initMap first.');
    }

    const marker = L.marker(coords).addTo(currentMap);
    if (popupHtml) {
        marker.bindPopup(popupHtml);
    }
    return marker;
}

function fitBounds(coords) {
    if (!currentMap) return;
    currentMap.fitBounds(coords);
}

function destroyMap(containerId) {
    if (!currentMap) return;
    currentMap.remove();
    currentMap = null;
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

export { initMap, clearMapMarkers, addMarker, fitBounds, destroyMap };