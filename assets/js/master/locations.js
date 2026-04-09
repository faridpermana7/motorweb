"use strict";
(function() {
    // API Configuration  
    // Function to fetch villages data from API
    function fetchVillages() {
        const url = `${window.API_BASE_URL}/villages`;
        
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Villages data received:', data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching villages:', error);
            console.error('Make sure the API server is running at:', url);
            alert('Failed to fetch villages data. Check console for details.');
            return null;
        });
    }
    
    // Function to fetch villages by district ID
    function fetchVillagesByDistrictId(districtId) {
        const url = `${window.API_BASE_URL}/villages/byparentid/${districtId}`;
        
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Villages data received:', data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching villages by district:', error);
            console.error('Make sure the API server is running at:', url);
            return null;
        });
    }
    
    // Function to display villages in table
    function displayVillagesInTable(tableId) {
        fetchVillages().then(data => {
            if (!data) {
                console.error('No data received from API');
                return;
            }
            
            const tableBody = document.querySelector(`${tableId} tbody`);
            if (!tableBody) {
                console.error('Table body not found');
                return;
            }
            
            // Clear existing rows
            tableBody.innerHTML = '';
            
            // Populate table with data
            data.forEach(village => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <p class="text-sm font-weight-bold mb-0">${village.name || 'N/A'}</p>
                    </td>
                    <td>
                        <p class="text-sm mb-0">${village.code || 'N/A'}</p>
                    </td>
                    <td class="align-middle">
                        <span class="badge badge-sm bg-gradient-success">${village.status || 'Active'}</span>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    }
    
    // Function to display villages in table by district ID
    function displayVillagesByDistrictId(tableId, districtId) {
        fetchVillagesByDistrictId(districtId).then(data => {
            if (!data) {
                console.error('No data received from API');
                return;
            }
            
            const tableBody = document.querySelector(`${tableId} tbody`);
            if (!tableBody) {
                console.error('Table body not found');
                return;
            }
            
            // Clear existing rows
            tableBody.innerHTML = '';
            
            // Check if data is an array and has items
            if (Array.isArray(data) && data.length > 0) {
                // Populate table with data
                data.forEach(village => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <p class="text-sm font-weight-bold mb-0">${village.name || 'N/A'}</p>
                        </td>
                        <td>
                            <p class="text-sm mb-0">${village.code || 'N/A'}</p>
                        </td>
                        <td class="align-middle">
                            <button type="button" onclick="showModalWithMap('${village.name}','${village.code}')" class="btn bg-gradient-primary" data-bs-toggle="modal" data-bs-target="#openMapModal">
                                Launch demo modal
                            </button> 
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                // Show message if no villages found
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="3" class="text-center p-4">
                        <p class="text-sm text-secondary">No villages found for this district</p>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    }

    function initLocations() {
        console.log('Locations JS loaded');
        
        // loadNavMenu is guaranteed to be available from bootstrap.js
        if (typeof loadNavMenu === 'function') {
            loadNavMenu();
        } else {
            console.error('loadNavMenu function not found');
        }
    }

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initLocations();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initLocations, { once: true });
    }

    
    // Expose functions to global scope if needed
    window.fetchVillages = fetchVillages;
    window.displayVillagesInTable = displayVillagesInTable;
    window.fetchVillagesByDistrictId = fetchVillagesByDistrictId;
    window.displayVillagesByDistrictId = displayVillagesByDistrictId;



    
})();