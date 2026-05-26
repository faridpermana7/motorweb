import { apiFetch } from "./api.js";  
import { formatDate } from '../utils/data-formater.js';  
import { applyTranslations } from '../utils/translations.js';

export function initDataTable({ tableId, url, columns, moduleName, disableAdd = false,
  onAdd, onEdit, onDelete, onSubmit, onConfirmDelete, enableImport = false, onImport, onImportConfirm }) { 
  const table = $(tableId).DataTable({
    dom: '<"d-flex justify-content-between align-items-center"f>rt<"d-flex justify-content-between align-items-center pg-bottom"lip>',
    ajax: (data, callback) => {
      apiFetch(url)
        .then(result => callback({ data: result }))
        .catch(err => {
          console.error(`Failed to load ${moduleName}:`, err);
          callback({ data: [] });
        });
    },
    columns: [
      { data: "id", title: "ID" },
      ...columns, 
      {
          data: "created_at",
          title: '<span data-phrase="Created At">Created At</span>',
          render: data => formatDate(data),
          className: "dt-right"
      },
      { data: "created_by", title: '<span data-phrase="Created By">Created By</span>' },
      {
          data: "updated_at",
          title: '<span data-phrase="Updated At">Updated At</span>',
          render: data => formatDate(data),
          className: "dt-right"
      },
      { data: "updated_by", title: '<span data-phrase="Updated By">Updated By</span>' },
      {
        data: null,
        title: '<span data-phrase="Actions">Actions</span>',
        render: (data, type, row) => {
          if (type === 'display') {
            return `
              <button class="btn btn-sm btn-dark edit-btn" data-id="${row.id}" data-phrase="Edit">Edit</button>
              <button class="btn btn-sm btn-light delete-btn" data-id="${row.id}" data-phrase="Delete">Delete</button>
            `;
          }
          return data; // fallback for sort/filter
        },
        orderable: false,
        searchable: false
      }
    ],
    responsive: true,
    pageLength: 10,
    scrollX: true,
    paging: true,
    autoWidth: false,
    drawCallback: function () {
      // Scoped translation: only inside this table
      applyTranslations(document.querySelector(tableId));
    },
    initComplete: function () { 
      let buttonsHtml = ""; 
      if (!disableAdd) {
        buttonsHtml += `
          <button class="btn btn-sm btn-dark add-btn ms-2">
            <span data-phrase="Add">Add</span> 
            <span data-phrase="${moduleName}">${moduleName}</span>
          </button>`;
      }

      if (enableImport) {
        buttonsHtml += `
          <button class="btn btn-sm btn-primary import-btn ms-2">
            <span data-phrase="Import">Import</span> 
            <span data-phrase="${moduleName}">${moduleName}</span>
          </button>`;
      } 

      if (buttonsHtml) {  
        $(`${tableId}_filter`).prepend(`<div class="add-datatables">${buttonsHtml}</div>`);
        applyTranslations(document.querySelector(`${tableId}_filter`)); // scoped translation for filter area (buttons and search label)
      }


      // Mark DataTables UI elements with data-phrase
      // $(`${tableId}_filter label`).attr('data-phrase', 'Search'); 
      // $(`${tableId}_filter input[type="search"]`).attr('placeholder', ''); // optional
      // // $(`#${tableId}_length label`).attr('data-phrase', 'Show entries');
      // // $(`#${tableId}_info`).attr('data-phrase', 'Showing entries');
      // $(`${tableId}_paginate .previous`).attr('data-phrase', 'Previous');
      // $(`${tableId}_paginate .next`).attr('data-phrase', 'Next');

      // Load translations and apply them AFTER DataTables is ready
    }
  }); 

  // Add button
  $(document).on("click", ".add-btn", () => {
    if (onAdd) onAdd();
  });

  // Edit button
  $(tableId).on("click", ".edit-btn", function() {
    const rowData = table.row($(this).closest("tr")).data();
    if (onEdit) onEdit(rowData);
  });

  // Delete button
  $(tableId).on("click", ".delete-btn", function() {
    const id = $(this).data("id");
    if (onDelete) onDelete(id);
  });

  // Import button
  $(document).on("click", ".import-btn", () => {
    if (onImport) onImport();
  });

  // Double‑click row
  $(tableId + " tbody").on("dblclick", "tr", function () {
    const rowData = table.row(this).data();
    if (rowData && onEdit) onEdit(rowData);
  });

  if (onSubmit) {
    $(document).on("submit", "#editForm", onSubmit);
  }
  if (onConfirmDelete) {
    $(document).on("click", "#confirmDelete", onConfirmDelete);
  }
  if (onImportConfirm) {
    $(document).on("click", "#confirmImport", onImportConfirm);
  }

  return table;
}
