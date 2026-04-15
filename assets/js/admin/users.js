"use strict";
import { apiFetch } from '../utils/api.js';
import { loadNavMenu } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/date-formater.js';
import { API_BASE_URL, configReady } from '../config.js';

(function() {
    let usersTable; // declare at top of file 

    function displayDatatables() {  
        const columns = [
            { data: "id" },
            { data: "username" },
            { data: "email" },
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

        usersTable = initDataTable({
            tableId: "#usersTable",
            url: `${API_BASE_URL}/users`,
            columns,
            moduleName: "User"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", { id: '', username: '', email: '' }); // open edit modal with empty data for adding new user
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = usersTable.row($(this).closest("tr")).data();
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
        await configReady;
        console.log('Users JS loaded');
        loadNavMenu();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === 'add') {
            $("#editTitle").text('Add User');
            $("#editId").val('');
            $("#editUsername").val('');
            $("#editEmail").val('');
            $("#editPassword").val('');
        }else{
            $("#editTitle").text('Edit User');
            $("#editId").val(rowData.id);
            $("#editUsername").val(rowData.username);
            $("#editEmail").val(rowData.email);
            // $("#editPassword").val(rowData.password_hash); // we don't want to pre-fill the password field with the hash, so we leave it blank
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