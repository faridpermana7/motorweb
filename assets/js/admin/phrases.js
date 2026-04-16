"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater';

(function() {
    let phrasesTable; // declare at top of file  

    function displayDatatables() {  
        const columns = [
            { data: "id" }, 
            { data: "phrase" },
            { data: "translation" },
            { data: "language" },
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

        phrasesTable = initDataTable({
            tableId: "#phrasesTable",
            url: `${API_BASE_URL}/phrases`,
            columns,
            moduleName: "Phrase"
        });
 
        $(document).on('click', '.add-btn', () => { 
            $("#editPassword").val('');
            openEditModal("add", {user: {}}); // open edit modal with empty data for adding new phrase
        });

        // Event delegation for buttons
        $(document).on("click", ".edit-btn", function() {
            const rowData = phrasesTable.row($(this).closest("tr")).data();
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
    
    async function initPhrases() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Phrases JS loaded');
        loadNavMenu();
        loadPageHeader('Phrases');
        loadFooter();
        displayDatatables();
        // whoamI(); 
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") { 
            $("#editId").val("");
            $("#editPhrase").val("");
            $("#editTranslation").val("");
            $("#editLanguage").val(""); 
        }
        else {
            $("#editId").val(rowData.id);
            $("#editPhrase").val(rowData.phrase);
            $("#editTranslation").val(rowData.translation);
            $("#editLanguage").val(rowData.language);
        }

        $("#editTitle").text(state === "add" ? "Add Phrase" : "Edit Phrase");
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
            phrase: $("#editPhrase").val(),
            translation: $("#editTranslation").val(),
            language: $("#editLanguage").val(),
            };

        //id null or empty means add new phrase, otherwise update existing phrase
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/phrases`, {
                method: "POST",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                phrasesTable.ajax.reload();
            } catch (err) {
                console.error("Add User failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/phrases/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
                });
                $("#editModal").modal("hide");
                phrasesTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/phrases/softdel/${id}`, {
            method: "PUT"
            });
            $("#deleteModal").modal("hide");
            phrasesTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initPhrases();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initPhrases, { once: true });
    } 
})();