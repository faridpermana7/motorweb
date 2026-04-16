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
            moduleName: "Item"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", {uom: {}, category: {}}); // open edit modal with empty data for adding new item
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = itemsTable.row($(this).closest("tr")).data();
            openEditModal("edit", rowData);
        });

        $(document).on("click", ".delete-btn", function() {
            const id = $(this).data("id");
            openDeleteModal(id);
        });

        // Form handlers
        $("#editForm").on("submit", handleEditSubmit);
        $("#confirmDelete").on("click", handleDeleteConfirm);
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
            $("#editBrand").val("");
            $("#editDescription").val("");
            $("#editUomName").val("");
            $("#editMinimumStock").val("");
            $("#editStock").val("");
            $("#editCostPrice").val("");
            $("#editSellingPrice").val("");
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
            $("#editCategoryName").val(rowData.category_name);
            $("#editBrand").val(rowData.brand);
            $("#editDescription").val(rowData.description);
            $("#editUomName").val(rowData.uom_name);
            $("#editMinimumStock").val(rowData.minimum_stock);
            $("#editStock").val(rowData.stock);
            $("#editCostPrice").val(formatCurrency(rowData.cost_price));
            $("#editSellingPrice").val(formatCurrency(rowData.selling_price));
        }

        $("#editTitle").text(state === "add" ? "Add Item" : "Edit Item");
        $("#editModal").modal("show");
    };

    const openDeleteModal = id => {
        $("#deleteId").val(id);
        $("#deleteModal").modal("show");
    };

    const handleEditSubmit = async e => {
        e.preventDefault();
        const id = $("#editId").val();
        const payload = {
            code: $("#editCode").val(),
            name: $("#editName").val(),
            barcode: $("#editBarcode").val(),
            category_id: $("#editCategoryId").val(),
            brand: $("#editBrand").val(),
            description: $("#editDescription").val(),
            uom_id: $("#editUomId").val(),
            minimum_stock: $("#editMinimumStock").val(),
            stock: $("#editStock").val(),
            selling_price: unformatCurrency($("#editSellingPrice").val()),
            cost_price: unformatCurrency($("#editCostPrice").val())
        }; 

        //id null or empty means add new item, otherwise update existing item
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/items`, {
                method: "POST",
                body: JSON.stringify(payload)
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
                body: JSON.stringify(payload)
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
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            itemsTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
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