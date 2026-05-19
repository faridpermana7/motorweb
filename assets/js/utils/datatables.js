import { apiFetch } from "./api.js"; 

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
      ...columns,
      {
        data: null,
        render: (data, type, row) => `
          <button class="btn btn-sm btn-dark edit-btn" data-id="${row.id}">Edit</button>
          <button class="btn btn-sm btn-light delete-btn" data-id="${row.id}">Delete</button>
        `,
        orderable: false,
        searchable: false
      }
    ],
    responsive: true,
    pageLength: 10,
    scrollX: true,
    paging: true,
    autoWidth: false,
    initComplete: function () { 
      let buttonsHtml = ""; 
      if (!disableAdd) {
        buttonsHtml += `
          <button class="btn btn-sm btn-dark add-btn ms-2">
            Add ${moduleName}
          </button>`;
      }

      if (enableImport) {
        buttonsHtml += `
          <button class="btn btn-sm btn-primary import-btn ms-2">
            Import ${moduleName}
          </button>`;
      }

      if (buttonsHtml) {
        $(`${tableId}_filter`).prepend(
          `<div class="add-datatables">${buttonsHtml}</div>`
        );
      }
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
