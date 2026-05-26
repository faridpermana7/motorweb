"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
    let phrasesTable; // declare at top of file  

    function displayDatatables() {  
        const columns = [
            { data: "phrase", title: '<span data-phrase="Phrase">Phrase</span>' },
            { data: "translation", title: '<span data-phrase="Translation">Translation</span>' },
            { data: "language", title: '<span data-phrase="Language">Language</span>' },
        ];

        phrasesTable = initDataTable({
            tableId: "#phrasesTable",
            url: `${API_BASE_URL}/phrases`,
            columns,
            moduleName: "Phrase",
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
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

        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="Phrase">Phrase</span>
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