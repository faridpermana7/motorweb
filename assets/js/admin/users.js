"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
    let usersTable; // declare at top of file 

    function displayDatatables() {  
        const columns = [
            { data: "username", title: '<span data-phrase="Username">Username</span>' },
            { data: "email", title: '<span data-phrase="Email">Email</span>' }
        ];

        usersTable = initDataTable({
            tableId: "#usersTable",
            url: `${API_BASE_URL}/users`,
            columns,
            moduleName: "User",
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
        console.log('Users JS loaded');
        loadNavMenu();
        loadPageHeader('Users');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === 'add') { 
            $("#editId").val('');
            $("#editUsername").val('');
            $("#editEmail").val('');
            $("#editPassword").val('');
        }else{ 
            $("#editId").val(rowData.id);
            $("#editUsername").val(rowData.username);
            $("#editEmail").val(rowData.email);
            // $("#editPassword").val(rowData.password_hash); // we don't want to pre-fill the password field with the hash, so we leave it blank
        }
        
        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="User">User</span>
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
            username: $("#editUsername").val(),
            email: $("#editEmail").val(),
            password: $("#editPassword").val() //we use password instead of password_hash because the API will hash it before saving to database
        };

        //id null or empty means add new user, otherwise update existing user
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/users`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                usersTable.ajax.reload();
            } catch (err) {
                console.error("Add User failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/users/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                usersTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/users/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            usersTable.ajax.reload();
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