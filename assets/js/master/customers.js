"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate, formatCurrency, unformatCurrency } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

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

    function displayDatatables() {  
        const columns = [
            { data: "name", title: '<span data-phrase="Name">Customer Name</span>' }, 
            { data: "type_name", title: '<span data-phrase="Type">Customer Type</span>' },
            { data: "phone", title: '<span data-phrase="Phone">Phone</span>' },
            { data: "email", title: '<span data-phrase="Email">Email</span>' },
            { data: "address", title: '<span data-phrase="Address">Address</span>' },
        ];

        customersTable = initDataTable({
            tableId: "#customersTable",
            url: `${API_BASE_URL}/customers`,
            columns,
            moduleName: "Customer",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
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
            $("#editTypeId").val(rowData.type_id);
            $("#editTypeName").val(rowData.type_name);
            $("#editEmail").val(rowData.email);
            $("#editAddress").val(rowData.address);
        } 

        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="Customer">Customer</span>
        `);
        // Scoped translation: only modal DOM
        applyTranslations(document.getElementById("editModal"));
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

    
    async function initUI() {
        initCustomers();
        // await loadTranslations();   // ✅ valid inside async
        // applyTranslations(); 
    }
    
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initCustomers();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initUI, { once: true });
    } 
})();