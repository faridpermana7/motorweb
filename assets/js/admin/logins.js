"use strict";
import { apiFetch } from '../utils/api.js';
import { loadNavMenu } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/date-formater.js';
import { API_BASE_URL, configReady } from '../config.js';

(function() {
    let loginsTable; // declare at top of file 
    const userSelect = document.getElementById('userSelect');

    
    // Fetch users on page load
    async function loadUsers() { 
        apiFetch(`${API_BASE_URL}/users`)
            .then(data => {
                console.log('Users loaded:', data);
                populateUsers(data);
            })
            .catch(err => {
                console.error('Error loading users:', err); 
            });
    }
    
    function populateUsers(users) {
        userSelect.innerHTML = '<option value="">-- Choose User --</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });
    }

        
    // Handle user selection change
    userSelect.addEventListener('change', function() { 
        $("#editUserId").val(this.value);  
    });

    function displayDatatables() {  
        const columns = [
            { data: "id" },
            { data: "user.username" },
            {
                data: "time",
                render: data => formatDate(data),
                className: "dt-right"
            },
            {
                data: "is_login",
                render: function (data) {
                    if (data) {
                    return '<span class="badge bg-success">Login</span>';
                    } else {
                    return '<span class="badge bg-danger">Logout</span>';
                    }
                },
                className: "dt-center"
            },
            { data: "ip_address" },
            { data: "user_agent" },
            { data: "location" },
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

        loginsTable = initDataTable({
            tableId: "#loginsTable",
            url: `${API_BASE_URL}/logins`,
            columns,
            moduleName: "Login"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", {user: {}}); // open edit modal with empty data for adding new login
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = loginsTable.row($(this).closest("tr")).data();
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
            .then(login => {
                // Do something with the login data, e.g., display loginname in the UI
                console.log("Logged in login:", login);
            })
            .catch(err => {
                console.error("Failed to fetch login info:", err);
            });
    }

    async function initLogins() {
        await configReady;
        console.log('Logins JS loaded');
        loadNavMenu();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") { 
            $("#userSelectContainer").show();   // visible in Add mode
            $("#userTextContainer").hide();   // hide in Add mode
            loadUsers(); // Load users when opening add modal to populate user dropdown
            $("#editId").val("");
            $("#editUserId").val("");
            $("#editTime").val("");
            $("#editUsername").val("");
            $(`input[name="editIsLogin"][value="${true}"]`).prop("checked", true);
            $("#editIpAddress").val("");
            $("#editUserAgent").val("");
        }
        else {
            $("#userSelectContainer").hide();   // hide in Edit mode
            $("#userTextContainer").show();   // show in Edit mode 
            $("#editId").val(rowData.id);
            $("#editUserId").val(rowData.user_id);
            $("#editTime").val(formatDate(rowData.time));
            $("#editUsername").val(rowData.user.username);
            $(`input[name="editIsLogin"][value="${rowData.is_login}"]`).prop("checked", true);
            $("#editIpAddress").val(rowData.ip_address);
            $("#editUserAgent").val(rowData.user_agent);
            $("#editLocation").val(rowData.location);
        }

        $("#editTitle").text(state === "add" ? "Add Login" : "Edit Login");
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
            user_id: $("#editUserId").val(),
            is_login: $('input[name="editIsLogin"]:checked').val() === "true",
            time: new Date($("#editTime").val()).toISOString(),
            ip_address: $("#editIpAddress").val(),
            user_agent: $("#editUserAgent").val(),
            location: $("#editLocation").val(),
            };

        //id null or empty means add new login, otherwise update existing login
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/logins`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                loginsTable.ajax.reload();
            } catch (err) {
                console.error("Add User failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/logins/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                loginsTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/logins/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            loginsTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initLogins();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initLogins, { once: true });
    } 
})();