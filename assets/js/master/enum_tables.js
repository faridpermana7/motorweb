"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/date-formater.js';

(function() {
    let enumTable; // declare at top of file  

    function displayDatatables() {  
        const columns = [
            { data: "id" }, 
            { data: "name" },
            { data: "type" },
            { data: "description" },
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

        enumTable = initDataTable({
            tableId: "#enumTable",
            url: `${API_BASE_URL}/enum_tables`,
            columns,
            moduleName: "Enum Table"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", {}); // open edit modal with empty data for adding new phrase
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = enumTable.row($(this).closest("tr")).data();
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

        $("#editTitle").text(state === "add" ? "Add Enum Table" : "Edit Enum Table");
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