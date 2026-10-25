import { apiFetch } from "./api.js";  
import { formatDate } from '../utils/data-formater.js';  
import { applyTranslations } from '../utils/translations.js';

export function initDataTable({ tableId, url, columns, moduleName, disableAdd = false,
  onAdd, onEdit, onDelete, onSubmit, onConfirmDelete, enableImport = false, onImport, onImportConfirm,
  enableExport = false, onExport,
  ajax: customAjax, includeId = true, includeAuditColumns = true, includeActions = true,
  serverSide = false, paging = true, scrollY = null }) {
  const standardColumns = [
    ...(includeId ? [{ data: "id", title: "ID" }] : []),
    ...columns,
    ...(includeAuditColumns ? [
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
      { data: "updated_by", title: '<span data-phrase="Updated By">Updated By</span>' }
    ] : []),
    ...(includeActions ? [{
      data: null,
      title: '<span data-phrase="Actions">Actions</span>',
      render: (data, type, row) => {
        if (type === 'display') {
          return `
            <button class="btn btn-sm btn-dark edit-btn" data-id="${row.id}" data-phrase="Edit">Edit</button>
            <button class="btn btn-sm btn-light delete-btn" data-id="${row.id}" data-phrase="Delete">Delete</button>
          `;
        }
        return data;
      },
      orderable: false,
      searchable: false
    }] : [])
  ];
  const idColumnIndex = standardColumns.findIndex(column => column.data === "id");

  const table = $(tableId).DataTable({
    dom: '<"d-flex justify-content-between align-items-center"f>rt<"d-flex justify-content-between align-items-center pg-bottom"lip>',
    order: idColumnIndex === -1 ? [] : [[idColumnIndex, "desc"]],
    serverSide,
    processing: serverSide,
    ajax: customAjax || (serverSide
      ? (request, callback) => {
        const requestUrl = new URL(url, window.location.origin);
        requestUrl.searchParams.set("skip", request.start);
        requestUrl.searchParams.set("limit", request.length);

        const search = request.search?.value?.trim();
        if (search) {
          requestUrl.searchParams.set("search", search);
        } else {
          requestUrl.searchParams.delete("search");
        }

        const order = request.order?.[0];
        if (order) {
          const column = request.columns[order.column]?.data;
          if (typeof column === "string") {
            requestUrl.searchParams.set("sort_by", column);
            requestUrl.searchParams.set("sort_order", order.dir);
          }
        } else {
          requestUrl.searchParams.delete("sort_by");
          requestUrl.searchParams.delete("sort_order");
        }

        apiFetch(requestUrl.toString())
          .then(result => {
            if (!Array.isArray(result.records) || !Number.isFinite(result.total)) {
              throw new TypeError(`Unexpected paginated response format for ${moduleName}`);
            }
            callback({
              draw: request.draw,
              recordsTotal: result.total,
              recordsFiltered: Number.isFinite(result.filtered_total)
                ? result.filtered_total
                : result.total,
              data: result.records
            });
          })
          .catch(err => {
            console.error(`Failed to load ${moduleName}:`, err);
            callback({
              draw: request.draw,
              recordsTotal: 0,
              recordsFiltered: 0,
              data: [],
              error: err.message || `Failed to load ${moduleName}`
            });
          });
      }
      : (data, callback) => {
        apiFetch(url)
          .then(result => callback({ data: result }))
          .catch(err => {
            console.error(`Failed to load ${moduleName}:`, err);
            callback({ data: [] });
          });
      }),
    columns: standardColumns,
    responsive: true,
    pageLength: 10,
    scrollX: true,
    scrollY,
    scrollCollapse: Boolean(scrollY),
    paging,
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
      if (enableExport) {
        buttonsHtml += `
          <button class="btn btn-sm btn-success export-btn ms-2">
            <span data-phrase="Export">Export</span>
            <span data-phrase="${moduleName}">${moduleName}</span>
          </button>`;
      }

      if (buttonsHtml) {  
        const container = table.table().container();
        const searchControl = container.querySelector('.dt-search, .dataTables_filter');
        const toolbarParent = searchControl?.parentElement
          || container.querySelector('.dt-layout-row')
          || container;
        const toolbar = document.createElement('div');
        toolbar.className = 'add-datatables d-flex align-items-center gap-2';
        toolbar.innerHTML = buttonsHtml;
        toolbarParent.prepend(toolbar);

        const searchLabel = container.querySelector('.dt-search label, .dataTables_filter label');
        if (searchLabel) {
          searchLabel.setAttribute('data-phrase', 'Search');
        }
        applyTranslations(container);
      }

    }
  }); 

  // Add button
  $(table.table().container()).on("click", ".add-btn", () => {
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
  $(table.table().container()).on("click", ".import-btn", () => {
    if (onImport) onImport();
  });

  $(table.table().container()).on("click", ".export-btn", () => {
    if (onExport) onExport();
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
