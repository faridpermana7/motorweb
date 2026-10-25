"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate, formatCurrency, unformatCurrency } from '../utils/data-formater.js';
import { applyTranslations } from '../utils/translations.js';

(function() {
    let itemsTable; // declare at top of file 
    const categorySelect = document.getElementById('categorySelect');
    const uomSelect = document.getElementById('uomSelect');
    const sellingPriceInput = document.getElementById("editSellingPrice");
    const costPriceInput = document.getElementById("editCostPrice");

    
    // Fetch enums on page load
    async function loadEnums() {
        const data = await apiFetch(`${API_BASE_URL}/enum_tables`);
        if (!Array.isArray(data)) {
            throw new TypeError("Unexpected enum response format");
        }
        populateEnums(data);
    }
    
    function populateEnums(enumData) {
        uomSelect.innerHTML = '<option value="">-- Choose --</option>';
        categorySelect.innerHTML = '<option value="">-- Choose --</option>';
        
        enumData.forEach(x => {
            if(x.type === 'UOM') {
                const option = document.createElement('option');
                option.value = x.id;
                option.textContent = x.name;
                uomSelect.appendChild(option);
            } else if(x.type === 'ItemCategory') {
                const option = document.createElement('option');
                option.value = x.id;
                option.textContent = x.name;
                categorySelect.appendChild(option);
            }
        });
    } 

    const importColumns = [
        "name", "uom_name", "category_name", "brand", "description", "code",
        "minimum_stock", "stock", "cost_price", "selling_price", "barcode"
    ];
    const requiredImportColumns = importColumns.filter(
        column => !["description", "code", "barcode"].includes(column)
    );

    function parseCsv(text) {
        text = text.replace(/^\uFEFF/, "");
        const rows = [];
        let row = [];
        let value = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === '"') {
                if (insideQuotes && text[i + 1] === '"') {
                    value += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === "," && !insideQuotes) {
                row.push(value);
                value = "";
            } else if ((char === "\n" || char === "\r") && !insideQuotes) {
                if (char === "\r" && text[i + 1] === "\n") i++;
                row.push(value);
                rows.push(row);
                row = [];
                value = "";
            } else {
                value += char;
            }
        }

        if (insideQuotes) {
            throw new Error("The CSV file contains an unclosed quoted field.");
        }
        if (value.length || row.length) {
            row.push(value);
            rows.push(row);
        }

        return rows.filter(csvRow => csvRow.some(cell => cell.trim()));
    }

    function downloadCsvTemplate() {
        const sampleRow = [
            "Sample Item", "Piece", "General", "Sample Brand",
            "Example item description", "", "1", "12", "5000", "10000", "SAMPLE-001"
        ];
        const csv = [importColumns, sampleRow]
            .map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(","))
            .join("\r\n");
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "items-import-template.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function exportItemsCsv() {
        try {
            const items = await apiFetch(`${API_BASE_URL}/items`);
            if (!Array.isArray(items)) {
                throw new TypeError("Unexpected items response format");
            }
            if (!items.length) {
                alert("There are no items to export.");
                return;
            }

            const csvRows = [
                importColumns,
                ...items.map(item => importColumns.map(column => item[column] ?? ""))
            ];
            const csv = csvRows
                .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
                .join("\r\n");
            const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "items-export.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error("Item export failed:", err);
            alert(err.message || "Unable to export items.");
        }
    }
    
    // Format while typing
    costPriceInput.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw) {
        e.target.value = formatCurrency(raw);
    } else {
        e.target.value = "";
    }
    });
        
    // Format while typing
    sellingPriceInput.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw) {
        e.target.value = formatCurrency(raw);
    } else {
        e.target.value = "";
    }
    });

    function displayDatatables() {  
        const columns = [ 
            { data: "code", title: '<span data-phrase="Code">Code</span>' },
            { data: "name", title: '<span data-phrase="Name">Name</span>' },
            { data: "barcode", title: '<span data-phrase="Barcode">Barcode</span>' },
            { data: "category_name", title: '<span data-phrase="Category">Category</span>' },
            { data: "brand", title: '<span data-phrase="Brand">Brand</span>' },
            { data: "description", title: '<span data-phrase="Description">Description</span>' },
            { data: "uom_name", title: '<span data-phrase="UOM">UOM</span>' },
            { data: "minimum_stock", title: '<span data-phrase="Minimum Stock">Minimum Stock</span>' },
            { data: "stock", title: '<span data-phrase="Stock">Stock</span>' },
            {
                data: "cost_price",
                title: '<span data-phrase="Cost Price">Cost Price</span>',
                render: data => formatCurrency(data),
                className: "dt-right"
            },
            {
                data: "selling_price",
                title: '<span data-phrase="Selling Price">Selling Price</span>',
                render: data => formatCurrency(data),
                className: "dt-right"
            }, 
        ];

        itemsTable = initDataTable({
            tableId: "#itemsTable",
            url: `${API_BASE_URL}/items/pagination`,
            columns,
            moduleName: "Item",
            serverSide: true,
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm,
            enableImport: true,
            onImport: () => openImportModal(),
            onImportConfirm: handleImportConfirm,
            enableExport: true,
            onExport: exportItemsCsv
        }); 

        // // Form handlers
        // $("#editForm").on("submit", handleEditSubmit);
        // $("#confirmDelete").on("click", handleDeleteConfirm);
    } 
  

    async function initItems() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Items JS loaded');
        loadNavMenu();
        loadPageHeader('Items');
        loadFooter();
        displayDatatables();
        document.getElementById("downloadCsvTemplate").addEventListener("click", downloadCsvTemplate);
        try {
            await loadEnums();
            await openItemFromQuery();
        } catch (err) {
            console.error("Failed to initialize item editor:", err);
            window.showAlert(err.message || "Unable to open the requested item.", "danger");
        }
        // whoamI(); 
    }

    async function openItemFromQuery() {
        const itemId = new URLSearchParams(window.location.search).get("edit");
        if (!itemId) return;

        const items = await apiFetch(`${API_BASE_URL}/items`);
        if (!Array.isArray(items)) {
            throw new TypeError("Unexpected items response format");
        }

        const item = items.find(row => String(row.id) === itemId);
        if (!item) {
            throw new Error("The requested item could not be found.");
        }

        $("#editModal").one("shown.bs.modal", () => {
            document.getElementById("editStock").focus();
        });
        openEditModal("edit", item);
    }


    const openEditModal = (state, rowData) => {
        if(state === "add") {   
            $("#editId").val("");
            $("#editCode").val("");
            $("#editName").val("");
            $("#editBarcode").val("");
            $("#categorySelect").val("");
            $("#editBrand").val("ASPIRA");
            $("#editDescription").val("");
            $("#uomSelect").val("");
            $("#editMinimumStock").val("1");
            $("#editStock").val("12");
            $("#editCostPrice").val("5000");
            $("#editSellingPrice").val("10000");
        }
        else { 
            $("#editId").val(rowData.id);
            $("#editCode").val(rowData.code);
            $("#editName").val(rowData.name);
            $("#editBarcode").val(rowData.barcode);
            $("#categorySelect").val(rowData.category_id);
            $("#editBrand").val(rowData.brand);
            $("#editDescription").val(rowData.description);
            $("#uomSelect").val(rowData.uom_id);
            $("#editMinimumStock").val(rowData.minimum_stock);
            $("#editStock").val(rowData.stock);
            $("#editCostPrice").val(formatCurrency(rowData.cost_price));
            $("#editSellingPrice").val(formatCurrency(rowData.selling_price));
        }

        $("#editTitle").html(`
            <span data-phrase="${state === "add" ? "Add" : "Edit"}">${state === "add" ? "Add" : "Edit"}</span>
            <span data-phrase="Item">Item</span>
        `);
        // Scoped translation: only modal DOM
        applyTranslations(document.getElementById("editModal"));
        $("#editModal").modal("show");
    };

    const openImportModal = () => { 
        $("#importModal").modal("show");
    }; 
    const openDeleteModal = id => {
        $("#deleteId").val(id);
        $("#deleteModal").modal("show");
    };

    const handleEditSubmit = async e => {
        e.preventDefault();
        const id = $("#editId").val();
        const payload = {
            code: $("#editCode").val(),
            name: $("#editName").val(),
            barcode: $("#editBarcode").val(),
            category_id: $("#categorySelect").val() ? parseInt($("#categorySelect").val()) : null,
            brand: $("#editBrand").val(),
            description: $("#editDescription").val(),
            uom_id: $("#uomSelect").val() ? parseInt($("#uomSelect").val()) : null,
            minimum_stock: $("#editMinimumStock").val() ? parseInt($("#editMinimumStock").val()) : 0,
            stock: $("#editStock").val() ? parseInt($("#editStock").val()) : 0,
            selling_price: unformatCurrency($("#editSellingPrice").val()) || 0,
            cost_price: unformatCurrency($("#editCostPrice").val()) || 0
        };

        console.log('Sending payload:', payload); // Debug log

        // Basic validation
        if (!payload.name) {
            await showAlert("Code and Name are required fields.", "danger");
            return;
        } 

        //id null or empty means add new item, otherwise update existing item
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/items`, {
                method: "POST",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Add Item failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/items/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/items/softdel/${id}`, {
            method: "PUT",
            showSuccess: false
            });
            $("#deleteModal").modal("hide");
            itemsTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    
    const handleImportConfirm = async () => {  
        const fileInput = document.getElementById("csvFile");
        if (!fileInput.files.length) {
            await showAlert("Please select a CSV file first", "danger");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const rows = parseCsv(evt.target.result);
                if (!rows.length) {
                    await showAlert("The CSV file is empty.", "danger");
                    return;
                }

                const header = rows[0].map(column => column.trim().toLowerCase());
                const missingColumn = requiredImportColumns.find(column => !header.includes(column));
                if (missingColumn) {
                    showAlert(`Invalid header: missing ${missingColumn}`);
                    return;
                }

                const columnIndexes = Object.fromEntries(
                    importColumns.map(column => [column, header.indexOf(column)])
                );
                const items = [];
                const invalidRows = [];

                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].map(value => value.trim());
                    const obj = Object.fromEntries(
                        importColumns.map(column => [column, values[columnIndexes[column]] || ""])
                    );
                    const minimumStock = Number(obj.minimum_stock);
                    const stock = Number(obj.stock);
                    const costPrice = Number(obj.cost_price);
                    const sellingPrice = Number(obj.selling_price);
                    const rowErrors = [];
                    const missingFields = requiredImportColumns.filter(column => !obj[column]);
                    if (missingFields.length) {
                        rowErrors.push(`missing ${missingFields.join(", ")}`);
                    }
                    if (obj.name.length > 255) rowErrors.push("name exceeds 255 characters");
                    if (obj.brand.length > 100) rowErrors.push("brand exceeds 100 characters");
                    if (!Number.isInteger(minimumStock)) rowErrors.push("minimum_stock must be an integer");
                    if (!Number.isInteger(stock)) rowErrors.push("stock must be an integer");
                    if (!obj.cost_price || !Number.isFinite(costPrice)) rowErrors.push("cost_price must be numeric");
                    if (!obj.selling_price || !Number.isFinite(sellingPrice)) rowErrors.push("selling_price must be numeric");
                    if (obj.code.length > 50) rowErrors.push("code exceeds 50 characters");
                    if (obj.barcode.length > 50) rowErrors.push("barcode exceeds 50 characters");

                    if (rowErrors.length) {
                        invalidRows.push(`Row ${i + 1}: ${rowErrors.join("; ")}`);
                        continue;
                    }

                    items.push({
                        name: obj.name,
                        uom_name: obj.uom_name,
                        category_name: obj.category_name,
                        brand: obj.brand,
                        description: obj.description || null,
                        code: obj.code || null,
                        minimum_stock: minimumStock,
                        stock,
                        cost_price: costPrice,
                        selling_price: sellingPrice,
                        barcode: obj.barcode || null
                    });
                }

                if (!items.length) { 
                    showAlert(`No valid rows found in CSV.\n${invalidRows.join("\n")}`, 'danger');
                    return;
                }
                if (invalidRows.length) {
                    showAlert(`Import cancelled due to invalid rows:\n${invalidRows.join("\n")}`, 'danger');
                    return;
                }

                await apiFetch(`${API_BASE_URL}/items/import`, {
                method: "POST",
                body: JSON.stringify(items),
                showSuccess: true
                });
                $("#importModal").modal("hide");
                itemsTable.ajax.reload();
            } catch (err) {
                console.error("Item import failed:", err);
                showAlert(err.message || "Unable to import items.", 'danger');
            } 
        };

        reader.readAsText(file);
    };

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initItems();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initItems, { once: true });
    } 
})();