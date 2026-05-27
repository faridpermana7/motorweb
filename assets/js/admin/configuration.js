// configuration.js
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
  const ui = {
    saveBtn: document.getElementById('saveBtn')
  };


    
    // Fetch enums on page load
    async function loadConfiguration() { 
        apiFetch(`${API_BASE_URL}/configurations`)
            .then(data => {
                console.log('Configuration loaded:', data);  
                renderConfigurations(data);
                renderStoreSection(data);
            })
            .catch(err => {
                console.error('Error loading parents:', err); 
            });
    } 


    function renderConfigurations(configs) {
        const container = document.getElementById("settingsSection");
        container.innerHTML = "";

        // Intro text
        const intro = document.createElement("p");
        intro.className = "text-sm";
        intro.textContent = "Platform Settings Information";
        container.appendChild(intro);
        
        // Group by module
        const grouped = configs.reduce((acc, item) => {
            // Exclude attributes containing "store"
            if (item.attribute.toLowerCase().includes("store")) return acc;

            const module = item.module;
            if (!acc[module]) acc[module] = [];
            acc[module].push(item);
            return acc;
        }, {});

        console.log('Grouped Configurations:', grouped);

        Object.entries(grouped).forEach(([module, items]) => {
            // Section title
            const title = document.createElement("h6");
            title.className = "text-uppercase text-body text-xs font-weight-bolder mt-4";
            title.textContent = module;
            container.appendChild(title);

            // List group
            const ul = document.createElement("ul");
            ul.className = "list-group";

            // Sort items by type first, then attribute name
            // Define the order you want for types
            const typeOrder = { "bool": 1, "int": 2, "decimal": 3, "string": 4 };
            items.sort((a, b) => {
                const typeA = typeOrder[a.type] || 99;
                const typeB = typeOrder[b.type] || 99;

            if (typeA !== typeB) return typeA - typeB;
                return a.attribute.localeCompare(b.attribute);
            });

            items.forEach(cfg => {
                const li = document.createElement("li");
                li.className = "list-group-item border-0 px-0";

                switch (cfg.type) {
                    case "bool":
                    const checked = cfg.value === "true" ? "checked" : "";
                    // Example for a checkbox
                    li.innerHTML = `
                    <div class="form-check form-switch ps-0">
                        <input class="form-check-input ms-auto" 
                            type="checkbox" 
                            id="${cfg.module}_${cfg.attribute}" 
                            data-id="${cfg.id}" 
                            ${cfg.value === "true" ? "checked" : ""}>
                        <label class="form-check-label text-body ms-3 text-truncate w-80 mb-0" 
                            for="${cfg.module}_${cfg.attribute}">
                        ${cfg.attribute.replace(/_/g, " ")}
                        </label>
                    </div>
                    `;
                    break;

                    case "int":
                    case "decimal":
                    li.innerHTML = `
                        <label class="text-body">${cfg.attribute.replace(/_/g, " ")}:</label>
                        <input type="number" class="form-control" id="${cfg.module}_${cfg.attribute}" 
                                data-type="${cfg.type}"
                                data-id="${cfg.id}"
                                value="${cfg.value}">
                    `;
                    break;

                    case "string":
                    default:
                    li.innerHTML = `
                        <strong class="text-dark">${cfg.attribute.replace(/_/g, " ")}:</strong> &nbsp; ${cfg.value}
                    `;
                }

                ul.appendChild(li);
            });


            container.appendChild(ul);
        });
    }

    function renderStoreSection(configs) {
        const container = document.getElementById("storeSection");
        container.innerHTML = "";

        // Intro text
        const intro = document.createElement("p");
        intro.className = "text-sm";
        intro.textContent = "Store Information";
        container.appendChild(intro);

        // const hr = document.createElement("hr");
        // hr.className = "horizontal gray-light my-4";
        // container.appendChild(hr);

        const ul = document.createElement("ul");
        ul.className = "list-group";

        configs
            .filter(cfg => cfg.attribute.toLowerCase().includes("store"))
            .forEach(cfg => {
            const li = document.createElement("li");
            li.className = "list-group-item border-0 ps-0 text-sm";
 
            // Example for a text input
            li.innerHTML = `
            <label class="text-dark d-block mb-1">${cfg.attribute.replace(/_/g, " ")}:</label>
            <input type="text" class="form-control w-100"
                    id="${cfg.module}_${cfg.attribute}"
                    data-type="${cfg.type}"
                    data-id="${cfg.id}"
                    value="${cfg.value}">
            `;

            ul.appendChild(li);
        });

        container.appendChild(ul);
    }


    function initConfiguration() {
        console.log('Configuration JS loaded');
        loadNavMenu();
        loadConfiguration();

        ui.saveBtn.addEventListener('click', async () => {  
            try {
                // Collect all configs from the UI
                const payload = [];

                // Handle checkboxes (bool type)
                document.querySelectorAll(".form-check-input").forEach(input => { 
                    const parts = input.id.split("_");
                    const module = parts[0];
                    const attribute = parts.slice(1).join("_"); // preserve underscores
                    if(input.dataset.id){
                        payload.push({
                            id: input.dataset.id,          
                            module,
                            attribute,
                            value: input.checked ? "true" : "false",
                            type: "bool"
                        }); 
                    }
                });

                // Handle text inputs (string/int/decimal types)
                document.querySelectorAll("input.form-control").forEach(input => {
                    const parts = input.id.split("_");
                    const module = parts[0];
                    const attribute = parts.slice(1).join("_"); // preserve underscores
                    if(input.dataset.id){
                        payload.push({
                            id: input.dataset.id,
                            module,
                            attribute,
                            value: input.value,
                            type: input.dataset.type || "string" // or "int"/"decimal" if you want to detect numeric
                        });
                    }
                });

                console.log("Payload to send:", payload);

                // Call API to update all configs
                const updated = await apiFetch(`${API_BASE_URL}/configurations/list`, {
                method: "PUT", 
                body: JSON.stringify(payload),
                showSuccess: true
                }); 
                showAlert("Configuration updated successfully!", 'success');
                
                            
                // 🔹 Update localStorage directly from response
                const configs = updated.reduce((acc, row) => {
                const key = `${row.module}_${row.attribute}`;
                acc[key] = row.value;
                return acc;
                }, {});
                localStorage.setItem("configurations", JSON.stringify(configs));
                
                // 🔹 Reload page after success
                setTimeout(() => {
                window.location.reload();
                }, 1000); // small delay so user sees the success alert
            } catch (err) {
                console.error("Update failed:", err);
                showAlert("Failed to update configuration.", 'danger');
            }
        });
    }

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initConfiguration();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initConfiguration, { once: true });
    }
})();
