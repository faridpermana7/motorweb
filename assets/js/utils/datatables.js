import { apiFetch } from "./api.js"; 

export function initDataTable({ tableId, url, columns, moduleName }) {
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
    initComplete: function () {
      $(`${tableId}_filter`).prepend(
        `<div class="add-datatables">
           <button class="btn btn-sm btn-dark add-btn ms-2">Add ${moduleName}</button>
         </div>`
      );
    }
  });

  return table;
}
