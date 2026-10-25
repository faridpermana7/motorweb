"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader } from '../utils/nav.js';
import { initDataTable } from '../utils/datatables.js';

(function() {
    const ui = {
        refresh: document.getElementById('refreshStockReport'),
        summary: document.getElementById('stockReportSummary'),
        updatedAt: document.getElementById('stockReportUpdatedAt'),
        minimumCount: document.getElementById('minimumStockCount'),
        underCount: document.getElementById('underStockCount'),
        minimumTable: document.getElementById('minimumStockTable'),
        underTable: document.getElementById('underStockTable')
    };

    const numberFormat = new Intl.NumberFormat('id-ID');
    let minimumTable;
    let underTable;
    let resizeTimeout;

    function getScrollHeight() {
        return window.innerWidth < 1200
            ? 'calc(50vh - 235px)'
            : 'calc(100vh - 340px)';
    }

    function stockColumns() {
        const textRenderer = $.fn.dataTable.render.text();
        return [
            {
                data: 'code',
                title: '<span data-phrase="Code">Code</span>',
                render: textRenderer
            },
            {
                data: 'name',
                title: '<span data-phrase="Item">Item</span>',
                render: textRenderer
            },
            {
                data: 'category_name',
                title: '<span data-phrase="Category">Category</span>',
                render: textRenderer
            },
            {
                data: 'brand',
                title: '<span data-phrase="Brand">Brand</span>',
                render: textRenderer
            },
            {
                data: 'uom_name',
                title: '<span data-phrase="UOM">UOM</span>',
                render: textRenderer
            },
            {
                data: 'stock',
                title: '<span data-phrase="Stock">Stock</span>',
                render: value => numberFormat.format(Number(value)),
                className: 'dt-right'
            },
            {
                data: 'minimum_stock',
                title: '<span data-phrase="Minimum Stock">Minimum Stock</span>',
                render: value => numberFormat.format(Number(value)),
                className: 'dt-right'
            },
            {
                data: null,
                title: '<span data-phrase="Actions">Actions</span>',
                render: (value, type, row) => type === 'display'
                    ? `<button type="button" class="btn btn-sm btn-dark stock-edit-btn" data-item-id="${encodeURIComponent(String(row.id))}"><span data-phrase="Update Stock">Update Stock</span></button>`
                    : value,
                orderable: false,
                searchable: false
            }
        ];
    }

    function createTable(tableId, name) {
        return initDataTable({
            tableId,
            moduleName: name,
            disableAdd: true,
            includeId: false,
            includeAuditColumns: false,
            includeActions: false,
            paging: false,
            scrollY: getScrollHeight(),
            ajax: (_request, callback) => callback({ data: [] }),
            columns: stockColumns()
        });
    }

    function resizeTables() {
        [minimumTable, underTable].forEach(table => {
            const scrollBody = table.table().container().querySelector('.dt-scroll-body, .dataTables_scrollBody');
            if (scrollBody) scrollBody.style.height = getScrollHeight();
            table.columns.adjust();
        });
    }

    function updateReport(rows) {
        const minimumRows = [];
        const underRows = [];

        rows.forEach(item => {
            const stock = Number(item.stock);
            const minimumStock = Number(item.minimum_stock);
            if (!Number.isFinite(stock) || !Number.isFinite(minimumStock) || item.id == null) {
                throw new TypeError('The stock report contains an invalid item.');
            }

            if (stock === minimumStock) minimumRows.push(item);
            if (stock < minimumStock) underRows.push(item);
        });

        minimumRows.sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
        underRows.sort((left, right) =>
            (Number(left.stock) - Number(left.minimum_stock)) -
            (Number(right.stock) - Number(right.minimum_stock)) ||
            String(left.name || '').localeCompare(String(right.name || ''))
        );

        minimumTable.clear().rows.add(minimumRows).draw();
        underTable.clear().rows.add(underRows).draw();
        ui.minimumCount.textContent = numberFormat.format(minimumRows.length);
        ui.underCount.textContent = numberFormat.format(underRows.length);
        ui.summary.textContent = `${numberFormat.format(minimumRows.length + underRows.length)} item(s) at or below minimum stock`;
        ui.updatedAt.textContent = new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date());
    }

    async function loadStockReport() {
        ui.refresh.disabled = true;
        ui.refresh.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><span data-phrase="Refreshing">Refreshing</span>';
        try {
            const rows = await apiFetch(`${API_BASE_URL}/items/stocks`);
            if (!Array.isArray(rows)) {
                throw new TypeError('Unexpected stock report response format.');
            }
            updateReport(rows);
        } catch (error) {
            console.error('Failed to load stock report:', error);
            window.showAlert(error.message || 'Unable to load the stock report.', 'danger');
        } finally {
            ui.refresh.disabled = false;
            ui.refresh.innerHTML = '<span class="material-symbols-rounded align-middle me-1">refresh</span><span data-phrase="Refresh">Refresh</span>';
        }
    }

    function openItemEditor(event) {
        const button = event.target.closest('.stock-edit-btn');
        if (!button) return;

        const itemId = decodeURIComponent(button.dataset.itemId);
        const editorUrl = new URL('../master/items.html', window.location.href);
        editorUrl.searchParams.set('edit', itemId);
        window.open(editorUrl.href, '_blank', 'noopener,noreferrer');
    }

    async function initStocksReport() {
        if (!API_BASE_URL) await configReady;

        loadNavMenu();
        loadPageHeader('Stock Report');
        minimumTable = createTable('#minimumStockTable', 'Minimum Stock');
        underTable = createTable('#underStockTable', 'Under Stock');

        ui.minimumTable.addEventListener('click', openItemEditor);
        ui.underTable.addEventListener('click', openItemEditor);
        ui.refresh.addEventListener('click', loadStockReport);
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeTables, 100);
        });
        await loadStockReport();
    }

    async function initUI() {
        try {
            await initStocksReport();
        } catch (error) {
            console.error('Failed to initialize Stock report:', error);
            window.showAlert(error.message || 'Unable to initialize the Stock report.', 'danger');
        }
    }

    if (window.appReady !== undefined) {
        initUI();
    } else {
        window.addEventListener('appReady', initUI, { once: true });
    }
})();