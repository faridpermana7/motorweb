"use strict"; 
import { apiFetch } from '../utils/api.js';
import { loadNavMenu } from '../utils/nav.js'; 
import { API_BASE_URL, configReady } from '../config.js';

// Sample data structure - adjust API endpoints as needed
// const provinceSelect = document.getElementById('provinceSelect');
const provinceSelect = document.getElementById('provinceSelect');
const citySelect = document.getElementById('citySelect');
const districtSelect = document.getElementById('districtSelect');
let villagesTable; // declare at top of file

// Fetch provinces on page load
async function loadProvinces() {
    try {
        const data = await apiFetch(`${API_BASE_URL}/provinces`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        console.log('Provinces loaded:', data);
        populateProvinces(data);
    } catch(error){
        console.error('Error loading provinces:', error);
        // Fallback with sample data for testing
        loadSampleProvinces();
    };
}

function populateProvinces(provinces) {
    provinceSelect.innerHTML = '<option value="">-- Choose Province --</option>';
    
    provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.id || province.name;
        option.textContent = province.name;
        provinceSelect.appendChild(option);
    });
}

// Load sample data for testing (remove when API works)
function loadSampleProvinces() {
    const sampleProvinces = [
        { id: 1, name: 'East Kalimantan' },
        { id: 2, name: 'West Kalimantan' },
        { id: 3, name: 'South Kalimantan' }
    ];
    populateProvinces(sampleProvinces);
}

// Handle province selection change
provinceSelect.addEventListener('change', function() {
    const provinceId = this.value;
    
    if (!provinceId) {
        citySelect.innerHTML = '<option value="">-- Choose City --</option>';
        citySelect.disabled = true;
        districtSelect.innerHTML = '<option value="">-- Choose District --</option>';
        districtSelect.disabled = true;
        return;
    }
    
    // Fetch cities for selected province
    fetch(`${API_BASE_URL}/cities/byparentid/${provinceId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Cities loaded:', data);
        populateCities(data);
    })
    .catch(error => {
        console.error('Error loading cities:', error);
        // Fallback with sample data for testing
        loadSampleCities(provinceId);
    });
});

// Handle city selection change
citySelect.addEventListener('change', function() {
    const cityId = this.value;
    
    if (!cityId) {
        districtSelect.innerHTML = '<option value="">-- Choose District --</option>';
        districtSelect.disabled = true;
        return;
    }
    
    // Fetch districts for selected city
    fetch(`${API_BASE_URL}/districts/byparentid/${cityId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Districts loaded:', data);
        populateDistricts(data);
    })
    .catch(error => {
        console.error('Error loading districts:', error);
        // Fallback with sample data for testing
        loadSampleDistricts(cityId);
    });
});

// Handle district selection change - Load villages
districtSelect.addEventListener('change', function() {
    const districtId = this.value;
    
    if (!districtId) {
        console.log('No district selected');
        return;
    }
    
    console.log('Loading villages for district:', districtId);
    displayVillagesByDistrictId(districtId);
});

function populateCities(cities) {
    citySelect.innerHTML = '<option value="">-- Choose City --</option>';
    citySelect.disabled = false;
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id || city.name;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

function populateDistricts(districts) {
    districtSelect.innerHTML = '<option value="">-- Choose District --</option>';
    districtSelect.disabled = false;
    
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.id || district.name;
        option.textContent = district.name;
        districtSelect.appendChild(option);
    });
}

// Load sample cities for testing
function loadSampleCities(provinceId) {
    const sampleCities = {
        1: [ // East Kalimantan
            { id: 1, name: 'Samarinda' },
            { id: 2, name: 'Balikpapan' },
            { id: 3, name: 'Bontang' }
        ],
        2: [ // West Kalimantan
            { id: 4, name: 'Pontianak' },
            { id: 5, name: 'Singkawang' }
        ],
        3: [ // South Kalimantan
            { id: 6, name: 'Banjarmasin' },
            { id: 7, name: 'Banjarbaru' }
        ]
    };
    
    const cities = sampleCities[provinceId] || [];
    populateCities(cities);
}

// Load sample districts for testing
function loadSampleDistricts(cityId) {
    const sampleDistricts = {
        1: [ // Samarinda
            { id: 101, name: 'Samarinda Kulu' },
            { id: 102, name: 'Samarinda Ilir' },
            { id: 103, name: 'Samarinda Ulu' }
        ],
        2: [ // Balikpapan
            { id: 201, name: 'Balikpapan Barat' },
            { id: 202, name: 'Balikpapan Timur' },
            { id: 203, name: 'Balikpapan Utara' }
        ],
        3: [ // Bontang
            { id: 301, name: 'Bontang Utara' },
            { id: 302, name: 'Bontang Selatan' }
        ],
        4: [ // Pontianak
            { id: 401, name: 'Pontianak Utara' },
            { id: 402, name: 'Pontianak Pusat' },
            { id: 403, name: 'Pontianak Timur' }
        ],
        5: [ // Singkawang
            { id: 501, name: 'Singkawang Utara' },
            { id: 502, name: 'Singkawang Tengah' }
        ],
        6: [ // Banjarmasin
            { id: 601, name: 'Banjarmasin Utara' },
            { id: 602, name: 'Banjarmasin Pusat' },
            { id: 603, name: 'Banjarmasin Selatan' }
        ],
        7: [ // Banjarbaru
            { id: 701, name: 'Banjarbaru Utara' },
            { id: 702, name: 'Banjarbaru Selatan' }
        ]
    };
    
    const districts = sampleDistricts[cityId] || [];
    populateDistricts(districts);
}

// // Initialize on page load
// document.addEventListener('DOMContentLoaded', function() {
//     loadProvinces();
// });
 
// Function to display villages in table by district ID
function displayVillagesByDistrictId(districtId) { 
  villagesTable
    .ajax.url(`${API_BASE_URL}/villages/byparentid/${districtId}`)
    .load();
}

function loadDatatables() {
    // Initialize once
    villagesTable = $('#villagesTable').DataTable({
    ajax: {
        url: `${API_BASE_URL}/villages/byparentid/0`, // default or placeholder
        dataSrc: ""
    },
    columns: [
        { data: "id" },
        { data: "name" },
        { data: "code" },
        { data: "district_id" }
    ],
    layout: {
        topStart: {
            buttons: [
                { extend: 'create', editor: editor },
                { extend: 'edit', editor: editor },
                { extend: 'remove', editor: editor }
            ]
        }
    },
    select: true,
    responsive: true,
    pageLength: 10
    }); 
}

function initLocations() {
    console.log('Locations JS loaded');
    loadNavMenu();
}

async function onAppReady() {
  await configReady;
  initLocations();
  loadProvinces();
  loadDatatables();
}

// If bootstrap.js already fired the event, run immediately
if (window.appReady !== undefined) {
  onAppReady();
} else {
  // Otherwise wait for the event
  window.addEventListener("appReady", onAppReady, { once: true });
}



    
