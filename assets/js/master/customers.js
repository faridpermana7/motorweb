"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate, formatCurrency, unformatCurrency } from '../utils/data-formater.js';

(function() {
    let customersTable; // declare at top of file 
    const typeSelect = document.getElementById('typeSelect');

    
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
        typeSelect.innerHTML = '<option value="">-- Choose --</option>';
        
        enumData.forEach(x => {
            if(x.type === 'CustomerType') {
                const option = document.createElement('option');
                option.value = x.id;
                option.textContent = x.name;
                typeSelect.appendChild(option);
            }  
        });
    }
        
    // Handle type selection change
    typeSelect.addEventListener('change', function() { 
        $("#editTypeId").val(this.value);  
    });

    // Handle type selection change
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
            { data: "name" },
            { data: "type_name" }, 
            { data: "phone" },
            { data: "email" }, 
            { data: "address" },
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

        customersTable = initDataTable({
            tableId: "#customersTable",
            url: `${API_BASE_URL}/customers`,
            columns,
            moduleName: "Customer"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", {type: {}, category: {}}); // open edit modal with empty data for adding new customer
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = customersTable.row($(this).closest("tr")).data();
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

    async function initCustomers() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Customers JS loaded');
        loadNavMenu();
        loadPageHeader('Customers');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") { 
            $("#typeSelectContainer").show();   // visible in Add mode 
            loadEnums(); // Load enums when opening add modal to populate dropdowns
            
            $("#editId").val("");
            $("#editName").val("");
            $("#editPhone").val("");
            $("#editTypeName").val("");
            $("#editEmail").val("");
            $("#editAddress").val("");
        }
        else {
            $("#typeSelectContainer").hide();   // hide in Edit mode
            $("#typeTextContainer").show();   // show in Edit mode

            $("#editId").val(rowData.id);
            $("#editName").val(rowData.name);
            $("#editPhone").val(rowData.phone);
            $("#editTypeName").val(rowData.type_name);
            $("#editEmail").val(rowData.email);
            $("#editAddress").val(rowData.address);
        }

        $("#editTitle").text(state === "add" ? "Add Customer" : "Edit Customer");
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
            name: $("#editName").val(),
            phone: $("#editPhone").val(),
            email: $("#editEmail").val(),
            type_id: $("#editTypeId").val() ? parseInt($("#editTypeId").val()) : null,
            address: $("#editAddress").val()
        };

        console.log('Sending payload:', payload); // Debug log

        // Basic validation
        if (!payload.name) {
            await alert("Name is a required field.", "warning");
            return;
        } 

        //id null or empty means add new customer, otherwise update existing customer
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/customers`, {
                method: "POST",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                customersTable.ajax.reload();
            } catch (err) {
                console.error("Add Customer failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/customers/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                customersTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/customers/softdel/${id}`, {
            method: "PUT",
            showSuccess: false
            });
            $("#deleteModal").modal("hide");
            customersTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initCustomers();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initCustomers, { once: true });
    } 
})();