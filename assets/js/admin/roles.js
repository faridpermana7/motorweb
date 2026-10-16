"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
    let rolesTable; // declare at top of file  
    const groupsSelect = document.getElementById("editGroups");

    function displayDatatables() {  
        const columns = [
            { data: "name", title: '<span data-phrase="Name">Name</span>' },
            { data: "groups", title: '<span data-phrase="groups">Groups</span>' }
        ];

        rolesTable = initDataTable({
            tableId: "#rolesTable",
            url: `${API_BASE_URL}/roles`,
            columns,
            moduleName: "Role",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
    } 
    
    async function initRoles() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Roles JS loaded');
        $('#editGroups').select2({
            placeholder: 'Select parent groups',
            closeOnSelect: false,
            width: '100%',
            dropdownParent: $('#editModal')
        });
        loadNavMenu();
        loadPageHeader('Roles');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    async function loadParents(excludeId = null) {
        excludeId = excludeId ? excludeId : 0;
        const parents = await apiFetch(`${API_BASE_URL}/roles`);
        groupsSelect.replaceChildren(); 
        parents.forEach(parent => {
            if (parent.id != excludeId) {
                const option = document.createElement('option');
                option.value = parent.id;
                option.textContent = parent.name;
                groupsSelect.appendChild(option);
            }
        });
    }

    const openEditModal = async (state, rowData) => {
        try {
            await loadParents(rowData.id);
        } catch (err) {
            console.error('Failed to load parent groups:', err);
            return;
        }

        if(state === 'add') { 
            $("#editId").val('');
            $("#editName").val('');
            $("#editGroups").val([]).trigger('change');
        }else{ 
            $("#editId").val(rowData.id);
            $("#editName").val(rowData.name);
            const groupIds = Array.isArray(rowData.groups)
                ? rowData.groups.map(id => String(id).trim()).filter(Boolean)
                : String(rowData.groups || '').split(',').map(id => id.trim()).filter(Boolean);
            $("#editGroups").val(groupIds).trigger('change');
        }
        
        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="Role">Role</span>
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
        const selectedGroups = $("#editGroups").val() || [];
        const payload = {
            name: $("#editName").val(),
            groups: selectedGroups.join(',')
        };

        //id null or empty means add new role, otherwise update existing role
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/roles`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                rolesTable.ajax.reload();
            } catch (err) {
                console.error("Add Role failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/roles/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                rolesTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/roles/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            rolesTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initRoles();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initRoles, { once: true });
    } 
})();