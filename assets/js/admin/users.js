"use strict";
import { apiFetch } from '../utils/api.js';
import { loadNavMenu } from '../utils/nav.js';
import { formatDate } from '../utils/date-formater.js';

(function() { 
    // Function to fetch users by district ID
    // Function to display users in table by district ID
    function displayListData(tableId) {
        
        const url = `${window.API_BASE_URL}/users`;
          $(tableId).DataTable({
                ajax: async (data, callback) => {
                try {
                    const users = await apiFetch(url);
                    callback({ data: users });
                } catch (err) {
                    console.error("Failed to load users:", err);
                    callback({ data: [] });
                }
                },
                columns: [
                { data: "id" },
                { data: "username" },
                { data: "email" },
                { 
                    data: "created_at",
                    render: function(data) {
                        return formatDate(data);
                    },
                    className: "dt-right" 
                },
                { data: "created_by" },
                { 
                    data: "updated_at",
                    render: function(data) {
                        return formatDate(data);
                    },
                    className: "dt-right" 
                },
                { data: "updated_by" }
                ],
                responsive: true,
                pageLength: 10
            });  
    }


    function initUsers() {
        console.log('Users JS loaded');
        loadNavMenu();
        displayListData('#usersTable');
    }

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initUsers();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initUsers, { once: true });
    } 
})();