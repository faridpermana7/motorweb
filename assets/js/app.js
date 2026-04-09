(function() {
  // Wait for bootstrap.js dependencies to load before initializing
    function initApp() {
        const modalElement = document.getElementById('openMapModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        }
    }
    
    // API Configuration 
    window.API_BASE_URL = 'http://127.0.0.1:9999'; // Make it globally accessible for debugging

    // Check if appReady event has already fired
    if (window.appReady !== undefined) {
        initApp();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initApp, { once: true });
    }

  function getIndonesianTZLabel() {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Map common identifiers to Indonesian zones
        const mapping = {
            "Asia/Jakarta": "WIB (UTC+7)",
            "Asia/Makassar": "WITA (UTC+8)",
            "Asia/Jayapura": "WIT (UTC+9)",
            "Asia/Singapore": "WITA (UTC+8)" // Singapore shares UTC+8 with WITA
        };

        return mapping[tz] || tz; // fallback to raw tz if not mapped
    } 

    
    // Function to weather data from API
    function fetchWeather() {
        const url = `${window.API_BASE_URL}/weather/${window.villageCode}`; 
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            credentials: 'include'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid, redirect to sign-in
                    window.location.href = 'sign-in.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Villages data received:', data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error); 
            return null;
        });
    }

    function generateItem(data, index) {   
        const item = document.createElement("div");
        item.className = `carousel-item ${index === 0 ? "active" : ""}`; 
        // Convert to your system's current location time zone
        const date = new Date(data.local_datetime);

        const localTime = date.toLocaleString("id-ID", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hour: "2-digit",
        minute: "2-digit"
        });
        
        const fullDate = date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); 
        item.innerHTML = `<div class="min-h-screen flex items-center justify-center">
                        <div class="flex flex-col bg-white rounded p-2 w-full max-w-xs">
                            <div class="font-bold text-xl">${localTime} ${getIndonesianTZLabel()}</div>
                            <div class="text-sm text-gray-500">${fullDate}</div>
                            <div class="mt-6 text-6xl self-center inline-flex items-center justify-center rounded-lg text-indigo-400 h-24 w-24">
                                <img src="${data.image}" alt="${data.condition}" class="w-32 h-32" />
                            </div>
                            <div class="flex flex-row items-center justify-center mt-4">
                            <div class="font-medium text-6xl">${data.t}°</div>
                            <div class="flex flex-col items-center ml-6">
                                <div>${data.weather_desc_en}</div>
                                <div class="mt-1">
                                <span class="text-sm"><i class="far fa-long-arrow-up"></i></span>
                                <span class="text-sm font-light text-gray-500">Wind from ${data.wd} to ${data.wd_to}</span>
                                </div> 
                            </div>
                            </div>
                            <div class="flex flex-row justify-between mt-2">
                            <div class="flex flex-col items-center">
                                <div class="font-medium text-sm">Wind</div>
                                <div class="text-sm text-gray-500">${data.wd_deg}k/h</div>
                            </div>
                            <div class="flex flex-col items-center">
                                <div class="font-medium text-sm">Humidity</div>
                                <div class="text-sm text-gray-500">${data.hu}%</div>
                            </div>
                            <div class="flex flex-col items-center">
                                <div class="font-medium text-sm">Visibility</div>
                                <div class="text-sm text-gray-500">${data.vs_text}</div>
                            </div>
                            </div>
                        </div>
                        </div>
                    `;  
        return item;
    }

    // Attach listener only once
    modalElement.addEventListener("shown.bs.modal", function() {
        const coordsMap = {
            // "64.01.01.2009": [-0.4947, 117.1431], // Samarinda
            // "64.01.01.2010": [-0.5, 117.2],       // another village
            // "64.01.01.2011": [-0.45, 117.1]       // another village
        };
        // window.weatherData = [ { city: "Sydney", temp: "24°" }, { city: "Tokyo", temp: "18°" }, { city: "New York", temp: "10°" } ];

        fetch("https://nominatim.openstreetmap.org/search?format=json&q="+ window.villageName)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                console.log("Coordinates:", lat, lon);

                // // Center map and add marker
                // map.setView([lat, lon], 12);
                // L.marker([lat, lon]).addTo(map).bindPopup("Samarinda").openPopup();
    
                // const coords = coordsMap[window.villageCode] || [-0.4947, 117.1431];
                const coords = [lat, lon];

                // Initialize map only once
                if (!window.currentMap) {
                    window.currentMap = L.map('map').setView(coords, 12);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19,
                        maxNativeZoom: 19
                    }).addTo(window.currentMap);
                } else {
                    // Reuse existing map
                    window.currentMap.setView(coords, 12);

                    // Clear old markers
                    window.currentMap.eachLayer(layer => {
                        if (!(layer instanceof L.TileLayer)) {
                            window.currentMap.removeLayer(layer);
                        }
                    });
                }

                // // Add markers
                // for (const [code, point] of Object.entries(coordsMap)) {
                //   L.marker(point).addTo(window.currentMap).bindPopup(`Village Code: ${window.villageCode}`);
                // }
                
                L.marker(coords).addTo(window.currentMap).bindPopup(`Village : ${window.villageName}<br>Code : ${window.villageCode}`);

                // Fit bounds to all markers
                window.currentMap.fitBounds(coords);

                // Fix rendering inside modal
                window.currentMap.whenReady(() => {
                    setTimeout(() => {
                        window.currentMap.invalidateSize();
                    }, 100);
                });
            } else { 
                alert("No coordinates found for " + window.villageName);
            } 
        });

        fetchWeather().then(resp => {
            if (resp) {
                console.log("Weather data:", resp);
                // You can display weather data in the modal here
                window.weatherData = [];            
                // Example array of weather data
                window.weatherData = resp.cuaca; // Assuming API returns data in this format 

                const carousel = document.getElementById("carouselNow");
                const carousel1 = document.getElementById("carousel1");
                const carousel2 = document.getElementById("carousel2");

                window.weatherData.now.forEach((data, index) => { 
                    const item = generateItem(data, index);
                    carousel.appendChild(item);
                }); 

                
                window.weatherData.day1.forEach((data, index) => { 
                    const item = generateItem(data, index);
                    carousel1.appendChild(item);
                }); 

                
                window.weatherData.day2.forEach((data, index) => { 
                    const item = generateItem(data, index);
                    carousel2.appendChild(item);
                }); 
            } else {
                console.error("Failed to fetch weather data");
            }
        });

    });

    // Function to show modal and set village code
    window.showModalWithMap = function(villageName, villageCode) { 
        console.log("Village name:", villageName);
        console.log("Village code:", villageCode);
        window.villageName = villageName; 
        window.villageCode = villageCode; 
        modal.show();
    };

    window.closeModalWithMap = function() { 
            const instance = bootstrap.Modal.getInstance(modalElement); 
            if (instance) { 
                instance.hide(); 
            }
            if (window.currentMap) { 
                window.currentMap.remove(); 
                window.currentMap = null; 
                // Reset the DOM element so Leaflet can re-init cleanly
                document.getElementById('map').innerHTML = "";
            } 
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove()); 
            document.body.classList.remove('modal-open'); 
            document.body.style.removeProperty('padding-right');
            console.log("Modal closed and map cleaned up");
        };

  })();
