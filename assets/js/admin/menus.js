"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';

(function() {
    let menusTable; // declare at top of file 
    const parentSelect = document.getElementById('parentSelect'); 
    const hasParentCheckbox = document.getElementById("hasParent");
    
    // Fetch enums on page load
    async function loadParents(parentId = null) { 
        apiFetch(`${API_BASE_URL}/menus/parents`)
            .then(data => {
                console.log('Parents loaded:', data);
                parentSelect.innerHTML = '<option value="">-- Choose --</option>';
                
                data.forEach(x => {
                    const option = document.createElement('option');
                    option.value = x.id;
                    option.textContent = x.label;
                    parentSelect.appendChild(option);
                });


                // ✅ Pre-select the parent if rowData has parent_id
                if (parentId) {
                    parentSelect.value = parentId;
                    // also fill the readonly text field if you want
                    const selected = data.find(x => x.id === parentId);
                    if (selected) {
                        document.getElementById("editParentName").value = selected.label;
                        document.getElementById("editParentId").value = selected.id;
                    }
                }
            })
            .catch(err => {
                console.error('Error loading parents:', err); 
            });
    } 
    
    // Handle parent selection change
    parentSelect.addEventListener('change', function() { 
        $("#editParentId").val(this.value);  
    });

    hasParentCheckbox.addEventListener("change", () => {
        hasParentToggle(hasParentCheckbox.checked);
    });

    function hasParentToggle(isChecked, parentId = null ) { 
        loadParents(parentId); // Load parents when opening add modal to populate dropdowns
        if (hasParentCheckbox.checked) {
            $("#parentSelectContainer").show();   // visible in Add mode  
            // $("#parentTextContainer").show();   // show in Edit mode
        } else {
            $("#parentSelectContainer").hide();   // visible in Add mode 
            // $("#parentTextContainer").hide();   // show in Edit mode
            $("#editParentId").val(null);
        } 
    }

    function displayDatatables() {  
        const columns = [
            { data: "id" },
            { data: "parent_name" },
            { data: "label" },
            { data: "path" },
            { data: "icon" },
            { data: "is_active" },
            { data: "sort_order" },
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

        menusTable = initDataTable({
            tableId: "#menusTable",
            url: `${API_BASE_URL}/menus`,
            columns,
            moduleName: "Menu",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
    } 

    function whoamI() {
        apiFetch(`${API_BASE_URL}/auth/me`)
            .then(user => {
                // Do something with the user data, e.g., display username in the UI
                console.log("Logged in user:", user);
            })
            .catch(err => {
                console.error("Failed to fetch user info:", err);
            });
    }

    async function initUsers() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Menus JS loaded');
        loadNavMenu();
        loadPageHeader('Users');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === 'add') {

            $("#editTitle").text('Add Menu');
            $("#editId").val('');
            $("#editLabel").val('');
            $("#editPath").val('');
            $("#editIcon").val('');
            $("#editIsActive").prop('checked', true);
            $("#editSortOrder").val(0); 
            // $("#editParentName").val("");
            $("#editParentId").val(0);  
        }else{ 
            $("#editTitle").text('Edit Menu');
            $("#editId").val(rowData.id);
            $("#editLabel").val(rowData.label);
            $("#editPath").val(rowData.path);
            $("#editIcon").val(rowData.icon);
            $("#editParentId").val(rowData.parent_id);
            // $("#editParentName").val(rowData.parent_name);
            $("#editIsActive").prop('checked', rowData.is_active);
            $("#editSortOrder").val(rowData.sort_order); 
        }
        
        if (rowData.parent_id) {  
            $("#hasParent").prop("checked", true);
            hasParentToggle(true, rowData.parent_id); 
        }
        else {
            $("#hasParent").prop("checked", false);
            hasParentToggle(false); 
        }
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
            label: $("#editLabel").val(),
            path: $("#editPath").val(),
            icon: $("#editIcon").val(),
            is_active: $("#editIsActive").is(":checked"),
            parent_id: $("#editParentId").val() ? parseInt($("#editParentId").val()) : null,
            sort_order: parseInt($("#editSortOrder").val())
        };

        //id null or empty means add new menu, otherwise update existing menu
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/menus`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                menusTable.ajax.reload();
            } catch (err) {
                console.error("Add User failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/menus/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                menusTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/menus/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            menusTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initUsers();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initUsers, { once: true });
    } 
})();