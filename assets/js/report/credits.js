"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { formatCurrency, formatDate } from '../utils/data-formater.js';
import { initDataTable } from '../utils/datatables.js';

(function() {
    const ui = {
        filters: document.getElementById('creditFilters'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        customerSelect: document.getElementById('customerSelect'),
        clearFilters: document.getElementById('clearFilters'),
        totalCreditDue: document.getElementById('totalCreditDue'),
        payAllButton: document.getElementById('payAllButton'),
        creditsTable: document.getElementById('creditsTable')
    };

    let customers = [];
    let creditTransactions = [];
    let creditsTable;
    let isProcessing = false;
    let pendingPaymentTransactions = [];

    function normalize(value) {
        return String(value || '').trim().toLocaleLowerCase();
    }

    function isCreditType(type) {
        return normalize(type) === 'credit';
    }

    function findWicCustomer(creditCustomer) {
        const matches = customers.filter(customer =>
            normalize(customer.name) === normalize(creditCustomer.name) &&
            normalize(customer.type_name) === 'wic'
        );

        if (matches.length !== 1) {
            throw new Error(matches.length
                ? `More than one WIC customer matches "${creditCustomer.name}".`
                : `No WIC customer matches "${creditCustomer.name}".`);
        }

        return matches[0];
    }

    function createTable() {
        creditsTable = initDataTable({
            tableId: '#creditsTable',
            moduleName: 'Credit',
            disableAdd: true,
            includeId: false,
            includeAuditColumns: false,
            includeActions: false,
            ajax: (request, callback) => callback({ data: creditTransactions }),
            columns: [
                {
                    data: 'created_at',
                    title: '<span data-phrase="Date">Date</span>',
                    render: value => formatDate(value)
                },
                {
                    data: 'id',
                    title: '<span data-phrase="Transaction">Transaction</span>'
                },
                {
                    data: 'customer_name',
                    title: '<span data-phrase="Customer">Customer</span>'
                },
                {
                    data: 'payment_method',
                    title: '<span data-phrase="Payment Method">Payment Method</span>'
                },
                {
                    data: 'total',
                    title: '<span data-phrase="Credit Amount">Credit Amount</span>',
                    render: value => formatCurrency(Number(value) || 0),
                    className: 'dt-right'
                },
                {
                    data: null,
                    title: '<span data-phrase="Actions">Actions</span>',
                    render: (value, type, row) => type === 'display'
                        ? `<button type="button" class="btn btn-sm btn-success pay-transaction" data-id="${Number(row.id)}" ${isProcessing ? 'disabled' : ''}>Pay</button>`
                        : value,
                    orderable: false,
                    searchable: false
                }
            ]
        });

    }

    async function loadCustomers() {
        const result = await apiFetch(`${API_BASE_URL}/customers`);
        if (!Array.isArray(result)) {
            throw new Error('The customers response was not a list.');
        }

        customers = result;
        ui.customerSelect.innerHTML = '<option value="">Choose a Credit customer</option>';
        customers
            .filter(customer => isCreditType(customer.type_name))
            .sort((left, right) => String(left.name).localeCompare(String(right.name)))
            .forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                ui.customerSelect.appendChild(option);
            });
    }

    function getTransactionDate(transaction) {
        const createdAt = String(transaction.created_at || '');
        return createdAt.slice(0, 10);
    }

    function getCustomerForTransaction(transaction) {
        return customers.find(customer => String(customer.id) === String(transaction.customer_id));
    }

    function updateReport(rows) {
        creditTransactions = rows;
        creditsTable.clear().rows.add(rows).draw();

        const due = rows.reduce((sum, transaction) => sum + (Number(transaction.total) || 0), 0);
        ui.totalCreditDue.textContent = formatCurrency(due);
        ui.payAllButton.disabled = isProcessing || rows.length === 0;
    }

    function setProcessing(processing) {
        isProcessing = processing;
        ui.payAllButton.disabled = processing || creditTransactions.length === 0;
        ui.creditsTable.querySelectorAll('.pay-transaction').forEach(button => {
            button.disabled = processing;
        });
        document.getElementById('confirmCreditPayment').disabled = processing;
    }

    async function applyFilters(event) {
        event.preventDefault();

        if (!ui.customerSelect.value) {
            window.showAlert('Choose a Credit customer to view transactions.', 'warning');
            return;
        }

        if (ui.startDate.value && ui.endDate.value && ui.startDate.value > ui.endDate.value) {
            window.showAlert('Start date must be on or before the end date.', 'warning');
            return;
        }

        const customer = customers.find(item => String(item.id) === ui.customerSelect.value);
        if (!customer || !isCreditType(customer.type_name)) {
            window.showAlert('Select a valid Credit customer.', 'warning');
            return;
        }

        try {
            const result = await apiFetch(`${API_BASE_URL}/transactions`);
            if (!Array.isArray(result)) {
                throw new Error('The transactions response was not a list.');
            }

            const rows = result.filter(transaction => {
                const transactionCustomer = getCustomerForTransaction(transaction);
                const transactionType = transaction.customer_type || transactionCustomer?.type_name;
                const date = getTransactionDate(transaction);

                return String(transaction.customer_id) === String(customer.id) &&
                    isCreditType(transactionType) &&
                    (!ui.startDate.value || date >= ui.startDate.value) &&
                    (!ui.endDate.value || date <= ui.endDate.value);
            });

            updateReport(rows);
        } catch (error) {
            console.error('Failed to load Credit transactions:', error);
            window.showAlert(error.message || 'Unable to load Credit transactions.', 'danger');
        }
    }

    async function updateTransactionCustomer(transaction, creditCustomer) {
        const wicCustomer = findWicCustomer(creditCustomer);
        const items = await apiFetch(`${API_BASE_URL}/transaction_items/${transaction.id}`);
        if (!Array.isArray(items)) {
            throw new Error(`Could not load items for transaction ${transaction.id}.`);
        }

        const payloadItems = items.map(item => ({
            item_id: item.item_id,
            name: item.item_name || item.name,
            quantity: item.quantity,
            price: item.price ?? item.selling_price
        }));
        const subtotal = transaction.subtotal == null
            ? payloadItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
            : Number(transaction.subtotal);

        const payload = {
            items: payloadItems,
            customer_id: Number(wicCustomer.id),
            payment_method: transaction.payment_method || null,
            subtotal,
            discount: Number(transaction.discount) || 0,
            total: Number(transaction.total) || 0,
            tax_id: transaction.tax_id || null,
            tax_value: Number(transaction.tax_value) || 0
        };

        await apiFetch(`${API_BASE_URL}/transactions/${transaction.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            showSuccess: false
        });
    }

    async function refreshReport() {
        await applyFilters(new Event('submit', { cancelable: true }));
    }

    function openPaymentConfirmation(transactions) {
        if (isProcessing || !transactions.length) return;

        pendingPaymentTransactions = transactions;
        const message = transactions.length === 1
            ? `Mark transaction #${transactions[0].id} as paid and move it to WIC?`
            : `Mark all ${transactions.length} displayed Credit transactions as paid and move them to WIC?`;
        document.getElementById('creditPaymentConfirmationMessage').textContent = message;
        $('#creditPaymentModal').modal('show');
    }

    async function confirmPayment() {
        if (isProcessing) return;

        const transactionsToPay = [...pendingPaymentTransactions];
        if (!transactionsToPay.length) return;

        setProcessing(true);
        let updatedCount = 0;

        try {
            const creditCustomer = customers.find(customer =>
                String(customer.id) === String(transactionsToPay[0].customer_id)
            );
            if (!creditCustomer) {
                throw new Error('Could not find the Credit customer for these transactions.');
            }

            for (const transaction of transactionsToPay) {
                await updateTransactionCustomer(transaction, creditCustomer);
                updatedCount += 1;
            }

            $('#creditPaymentModal').modal('hide');
            pendingPaymentTransactions = [];
            window.showAlert(`${updatedCount} transaction(s) marked as paid.`, 'success');
        } catch (error) {
            console.error('Failed to pay all Credit transactions:', error);
            const partialMessage = updatedCount
                ? `${updatedCount} transaction(s) were updated before the failure. `
                : '';
            window.showAlert(`${partialMessage}${error.message || 'Unable to update all transactions.'}`, 'danger');
        } finally {
            await refreshReport();
            setProcessing(false);
        }
    }

    async function initCreditsReport() {
        if (!API_BASE_URL) await configReady;

        loadNavMenu();
        loadPageHeader('Credit Report');
        loadFooter();
        createTable();
        await loadCustomers();

        ui.filters.addEventListener('submit', applyFilters);
        ui.clearFilters.addEventListener('click', () => {
            ui.filters.reset();
            updateReport([]);
        });
        ui.payAllButton.addEventListener('click', () => openPaymentConfirmation([...creditTransactions]));
        document.getElementById('confirmCreditPayment').addEventListener('click', confirmPayment);
        $('#creditsTable tbody').on('click', '.pay-transaction', function() {
            const row = creditsTable.row($(this).closest('tr')).data();
            if (row) openPaymentConfirmation([row]);
        });
    }

    async function initUI() {
        try {
            await initCreditsReport();
        } catch (error) {
            console.error('Failed to initialize Credit report:', error);
            window.showAlert(error.message || 'Unable to initialize Credit report.', 'danger');
        }
    }

    if (window.appReady !== undefined) {
        initUI();
    } else {
        window.addEventListener('appReady', initUI, { once: true });
    }
})();