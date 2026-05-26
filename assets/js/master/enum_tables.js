"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
    let enumTable; // declare at top of file  

    function displayDatatables() {  
        const columns = [
            { data: "name", title: '<span data-phrase="Name">Name</span>' },
            { data: "type", title: '<span data-phrase="Type">Type</span>' },
            { data: "description", title: '<span data-phrase="Description">Description</span>' },
        ];

        enumTable = initDataTable({
            tableId: "#enumTable",
            url: `${API_BASE_URL}/enum_tables`,
            columns,
            moduleName: "Enum Table",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
    } 
    
    async function initEnumTables() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('EnumTables JS loaded');
        loadNavMenu();
        loadPageHeader('EnumTables');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") { 
            $("#editId").val("");
            $("#editName").val("");
            $("#editType").val("");
            $("#editDescription").val(""); 
        }
        else {
            $("#editId").val(rowData.id);
            $("#editName").val(rowData.name);
            $("#editType").val(rowData.type);
            $("#editDescription").val(rowData.description);
        }

        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="Enum Table">Enum Table</span>
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
            type: $("#editType").val(),
            description: $("#editDescription").val()
        };

        //id null or empty means add new phrase, otherwise update existing phrase
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/enum_tables`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                enumTable.ajax.reload();
            } catch (err) {
                console.error("Add User failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/enum_tables/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                enumTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/enum_tables/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            enumTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initEnumTables();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initEnumTables, { once: true });
    } 
})();