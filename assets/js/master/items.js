"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate, formatCurrency, unformatCurrency } from '../utils/data-formater.js';

(function() {
    let itemsTable; // declare at top of file 
    const categorySelect = document.getElementById('categorySelect');
    const uomSelect = document.getElementById('uomSelect');
    const sellingPriceInput = document.getElementById("editSellingPrice");
    const costPriceInput = document.getElementById("editCostPrice");

    
    // Fetch enums on page load
    async function loadEnums() { 
        apiFetch(`${API_BASE_URL}/enum_tables`)
            .then(data => {
                console.log('Enums loaded:', data);
                populateEnums(data);
            })
            .catch(err => {
                console.error('Error loading enums:', err); 
            });
    }
    
    function populateEnums(enumData) {
        uomSelect.innerHTML = '<option value="">-- Choose --</option>';
        categorySelect.innerHTML = '<option value="">-- Choose --</option>';
        
        enumData.forEach(x => {
            if(x.type === 'UOM') {
                const option = document.createElement('option');
                option.value = x.id;
                option.textContent = x.name;
                uomSelect.appendChild(option);
            } else if(x.type === 'ItemCategory') {
                const option = document.createElement('option');
                option.value = x.id;
                option.textContent = x.name;
                categorySelect.appendChild(option);
            }
        });
    }
        
    // Handle uom selection change
    uomSelect.addEventListener('change', function() { 
        $("#editUomId").val(this.value);  
    });

    // Handle uom selection change
    categorySelect.addEventListener('change', function() { 
        $("#editCategoryId").val(this.value);  
    });

    
    // Format while typing
    costPriceInput.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw) {
        e.target.value = formatCurrency(raw);
    } else {
        e.target.value = "";
    }
    });
        
    // Format while typing
    sellingPriceInput.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw) {
        e.target.value = formatCurrency(raw);
    } else {
        e.target.value = "";
    }
    });

    function displayDatatables() {  
        const columns = [
            { data: "id" },
            { data: "code" },
            { data: "name" },
            { data: "barcode" },
            { data: "category_name" }, 
            { data: "brand" },
            { data: "description" },
            { data: "uom_name" }, 
            { data: "minimum_stock" },
            { data: "stock" },
            {
            data: "cost_price",
            render: data => formatCurrency(data),
            className: "dt-right"
            },
            {
            data: "selling_price",
            render: data => formatCurrency(data),
            className: "dt-right"
            },
            {
            data: "created_at",
            render: data => formatDate(data),
            className: "dt-right"
            },
            { data: "created_by" },
            {
            data: "updated_at",
            render: data => formatDate(data),
            className: "dt-right"
            },
            { data: "updated_by" }
        ];

        itemsTable = initDataTable({
            tableId: "#itemsTable",
            url: `${API_BASE_URL}/items`,
            columns,
            moduleName: "Item",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm,
            enableImport: true,
            onImport: () => openImportModal(),
            onImportConfirm: handleImportConfirm
        }); 

        // // Form handlers
        // $("#editForm").on("submit", handleEditSubmit);
        // $("#confirmDelete").on("click", handleDeleteConfirm);
    } 
  

    async function initItems() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Items JS loaded');
        loadNavMenu();
        loadPageHeader('Items');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") { 
            $("#uomSelectContainer").show();   // visible in Add mode
            $("#categorySelectContainer").show();   // visible in Add mode
            $("#uomTextContainer").hide();   // hide in Add mode
            $("#categoryTextContainer").hide();   // hide in Add mode
            loadEnums(); // Load enums when opening add modal to populate dropdowns
            
            $("#editId").val("");
            $("#editCode").val("");
            $("#editName").val("");
            $("#editBarcode").val("");
            $("#editCategoryName").val("");
            $("#editBrand").val("ASPIRA");
            $("#editDescription").val("");
            $("#editUomName").val("");
            $("#editMinimumStock").val("1");
            $("#editStock").val("12");
            $("#editCostPrice").val("5000");
            $("#editSellingPrice").val("10000");
        }
        else {
            $("#uomSelectContainer").hide();   // hide in Edit mode
            $("#categorySelectContainer").hide();   // hide in Edit mode
            $("#uomTextContainer").show();   // show in Edit mode
            $("#categoryTextContainer").show();   // show in Edit mode

            $("#editId").val(rowData.id);
            $("#editCode").val(rowData.code);
            $("#editName").val(rowData.name);
            $("#editBarcode").val(rowData.barcode);
            $("#editCategoryId").val(rowData.category_id);
            $("#editCategoryName").val(rowData.category_name);
            $("#editBrand").val(rowData.brand);
            $("#editDescription").val(rowData.description);
            $("#editUomId").val(rowData.uom_id);
            $("#editUomName").val(rowData.uom_name);
            $("#editMinimumStock").val(rowData.minimum_stock);
            $("#editStock").val(rowData.stock);
            $("#editCostPrice").val(formatCurrency(rowData.cost_price));
            $("#editSellingPrice").val(formatCurrency(rowData.selling_price));
        }

        $("#editTitle").text(state === "add" ? "Add Item" : "Edit Item");
        $("#editModal").modal("show");
    };

    const openImportModal = () => { 
        $("#importModal").modal("show");
    }; 

    const handleEditSubmit = async e => {
        e.preventDefault();
        const id = $("#editId").val();
        const payload = {
            code: $("#editCode").val(),
            name: $("#editName").val(),
            barcode: $("#editBarcode").val(),
            category_id: $("#editCategoryId").val() ? parseInt($("#editCategoryId").val()) : null,
            brand: $("#editBrand").val(),
            description: $("#editDescription").val(),
            uom_id: $("#editUomId").val() ? parseInt($("#editUomId").val()) : null,
            minimum_stock: $("#editMinimumStock").val() ? parseInt($("#editMinimumStock").val()) : 0,
            stock: $("#editStock").val() ? parseInt($("#editStock").val()) : 0,
            selling_price: unformatCurrency($("#editSellingPrice").val()) || 0,
            cost_price: unformatCurrency($("#editCostPrice").val()) || 0
        };

        console.log('Sending payload:', payload); // Debug log

        // Basic validation
        if (!payload.name) {
            await alert("Code and Name are required fields.", "warning");
            return;
        } 

        //id null or empty means add new item, otherwise update existing item
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/items`, {
                method: "POST",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Add Item failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/items/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/items/softdel/${id}`, {
            method: "PUT",
            showSuccess: false
            });
            $("#deleteModal").modal("hide");
            itemsTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    
    const handleImportConfirm = async () => {  
        const fileInput = document.getElementById("csvFile");
        if (!fileInput.files.length) {
            alert("Please select a CSV file first");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async (evt) => {
            const text = evt.target.result;
            const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);

            // 🔹 Validate header
            const header = rows[0].split(",").map(h => h.trim().toLowerCase());
            const expected = ["name","uom_id","category_id","brand","description","minimum_stock","stock","cost_price","selling_price","barcode"];
            for (const col of expected) {
            if (!header.includes(col)) {
                alert(`Invalid header: missing ${col}`);
                return;
            }
            }

            // 🔹 Parse and validate rows
            const items = [];
            for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(",").map(c => c.trim());
            if (cols.length < expected.length) continue;

            const obj = {};
            expected.forEach((col, idx) => obj[col] = cols[idx]);

            // Validation rules
            if (obj.name.length > 255) {
                console.error(`Row ${i}: name too long`);
                continue;
            }
            if (obj.brand.length > 100) {
                console.error(`Row ${i}: brand too long`);
                continue;
            }
            if (isNaN(parseInt(obj.uom_id)) || isNaN(parseInt(obj.category_id))) {
                console.error(`Row ${i}: uom_id/category_id must be int`);
                continue;
            }
            if (isNaN(parseInt(obj.minimum_stock)) || isNaN(parseInt(obj.stock))) {
                console.error(`Row ${i}: stock fields must be int`);
                continue;
            }
            if (isNaN(parseFloat(obj.cost_price)) || isNaN(parseFloat(obj.selling_price))) {
                console.error(`Row ${i}: prices must be float`);
                continue;
            }

            // Convert types
            items.push({
                name: obj.name,
                uom_id: parseInt(obj.uom_id),
                category_id: parseInt(obj.category_id),
                brand: obj.brand,
                description: obj.description,
                minimum_stock: parseInt(obj.minimum_stock),
                stock: parseInt(obj.stock),
                cost_price: parseFloat(obj.cost_price),
                selling_price: parseFloat(obj.selling_price),
                barcode: obj.barcode || null
            });
            }

            if (!items.length) {
            alert("No valid rows found in CSV");
            return;
            }
            
            try {
                await apiFetch(`${API_BASE_URL}/items/import`, {
                method: "POST",
                body: JSON.stringify(items),
                showSuccess: true
                });
                $("#importModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Add Item failed:", err);
            } 
        };

        reader.readAsText(file);
    };

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initItems();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initItems, { once: true });
    } 
})();