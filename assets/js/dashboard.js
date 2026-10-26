// dashboard.js
import { API_BASE_URL, configReady } from './config.js';
import { apiFetch } from './utils/api.js';
import { loadNavMenu, loadPageHeader } from './utils/nav.js';
import { formatCurrency } from './utils/data-formater.js'; 

(async function() {

  const ui = { 
    totalToday: document.getElementById('totalToday'),
    totalSales: document.getElementById('totalSales'),
    totalUsers: document.getElementById('totalUsers'),
    totalAll: document.getElementById('totalAll'),
    profitAll: document.getElementById('profitAll'),
    taxAll: document.getElementById('taxAll'),
    creditAll: document.getElementById('creditAll'),
    topProductsTitle: document.getElementById('topProductsTitle'),
    topProductsByRevenueTitle: document.getElementById('topProductsByRevenueTitle'),
    topProductsTableBody: document.getElementById('topProductsTableBody'),
    topProductsByRevenueTableBody: document.getElementById('topProductsByRevenueTableBody'),
    topCustomersByCreditTableBody: document.getElementById('topCustomersByCreditTableBody'),
    topCustomersByPointTableBody: document.getElementById('topCustomersByPointTableBody'),
    topCustomersByCreditTitle: document.getElementById('topCustomersByCreditTitle'),
    topCustomersByPointTitle: document.getElementById('topCustomersByPointTitle'),
    updatedDashboard1: document.getElementById('updatedDashboard1'),
    updatedDashboard2: document.getElementById('updatedDashboard2'),
    updatedDashboard3: document.getElementById('updatedDashboard3'), 
    totalMonths: document.getElementById('totalMonths'),
  };

    async function initDashboard() {
        await configReady;
        console.log('Dashboard JS loaded');
        loadNavMenu();
        loadPageHeader('Dashboard');
        
        // Initialize charts after nav is ready
        await initCharts();
    }


    async function initCharts() { 
        try {
            // Call your backend API
            const response = await apiFetch(`${API_BASE_URL}/transactions/dashboard/perday`); 

            ui.totalToday.textContent = formatCurrency(response.totals[6]); 
            ui.totalAll.textContent = formatCurrency(
                response.month_totals
                    .map(Number) // convert each string to a number
                    .reduce((a, b) => a + b, 0)
                );
            ui.profitAll.textContent = formatCurrency(
                response.month_profits
                    .map(Number) // convert each string to a number
                    .reduce((a, b) => a + b, 0)
                );
            ui.creditAll.textContent = formatCurrency(
                response.month_credit
                    .map(Number) // convert each string to a number
                    .reduce((a, b) => a + b, 0)
                );
            ui.taxAll.textContent = formatCurrency(
                response.month_tax
                    .map(Number) // convert each string to a number
                    .reduce((a, b) => a + b, 0)
                );
            ui.totalMonths.textContent = `Last ${response.month_labels.length} months`;
            const topProductsByQuantity = Array.isArray(response.top_products_by_quantity)
                ? response.top_products_by_quantity
                : [];
            const topProductsByRevenue = Array.isArray(response.top_products_by_revenue)
                ? response.top_products_by_revenue
                : [];
                
            const topCustomersByCredit = Array.isArray(response.top_credit_customers)
                ? response.top_credit_customers
                : [];
                
            const topCustomersByPoint = Array.isArray(response.top_point_customers)
                ? response.top_point_customers
                : [];
            ui.topProductsTitle.textContent = `Top ${topProductsByQuantity.length} Products`;
            ui.topProductsByRevenueTitle.textContent = `Top ${topProductsByRevenue.length} Products by Revenue`;
            ui.topCustomersByCreditTitle.textContent = `Top ${topCustomersByCredit.length} Customers by Credit`;
            ui.topCustomersByPointTitle.textContent = `Top ${topCustomersByPoint.length} Customers by Point`;
            populateTopProducts(topProductsByQuantity);
            populateTopProductsByRevenue(topProductsByRevenue);
            populateTopCustomersByCredit(topCustomersByCredit);
            populateTopCustomersByPoint(topCustomersByPoint);
            // Chart 1: Bar
            const ctx = document.getElementById("chart-bars")?.getContext("2d");
            if (ctx) {
            new Chart(ctx, {
                type: "bar",
                data: {
                // labels: ["M", "T", "W", "T", "F", "S", "S"],
                labels: response.labels,   // 🔹 from API
                datasets: [{
                    label: "Items Sold",
                    backgroundColor: "#43A047",
                    // data: [50, 45, 22, 28, 50, 60, 76],
                    data: response.items_sold,     // 🔹 from API
                    borderRadius: 4,
                    barThickness: 'flex'
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { beginAtZero: true } },
                    x: {}
                }
                }
            });
            }

            // Chart 2: Line (Sales)
            const ctx2 = document.getElementById("chart-line")?.getContext("2d");
            if (ctx2) {
            new Chart(ctx2, {
                type: "line",
                data: {
                labels: response.labels,   // 🔹 from API
                datasets: [{
                    label: "Penjualan",
                    borderColor: "#43A047",
                    backgroundColor: "transparent",
                    data: response.totals,     // 🔹 from API
                    pointRadius: 3,
                    pointBackgroundColor: "#43A047"
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                    callbacks: {
                        title: ctx => {
                        const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                        return months[ctx[0].dataIndex];
                        }
                    }
                    }
                }
                }
            });
            }

            // Chart 3: Line (Tasks)
            const ctx3 = document.getElementById("chart-line-tasks")?.getContext("2d");
            if (ctx3) {
            new Chart(ctx3, {
                type: "line",
                data: {
                labels: response.month_labels,   // 🔹 from API
                datasets: [{
                    label: "Total Sales",
                    borderColor: "#43A047",
                    backgroundColor: "transparent",
                    data: response.month_totals,     // 🔹 from API
                    pointRadius: 3,
                    pointBackgroundColor: "#43A047"
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
                }
            });
            }

            ui.updatedDashboard1.textContent = `Last updated: ${new Date().toLocaleString()}`;
            ui.updatedDashboard2.textContent = `Last updated: ${new Date().toLocaleString()}`;
            ui.updatedDashboard3.textContent = `Last updated: ${new Date().toLocaleString()}`;
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }


    function populateTopProducts(products) {
        if (!ui.topProductsTableBody) return;

        // Clear existing rows
        ui.topProductsTableBody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="align-middle text-left text-sm">
                    <p class="text-sm font-weight-bold mb-0">${product.name}</p>
                    <p class="text-xs text-secondary mb-0">Code: ${product.code}</p>
                </td>
                <td class="align-middle text-center text-sm">
                    <p class="text-sm font-weight-bold mb-0">${product.quantity_sold}</p>
                </td>
                <td class="align-middle text-right text-sm">
                    <p class="text-sm font-weight-bold mb-0">${formatCurrency(product.total_revenue)}</p>
                    <p class="text-xs text-secondary mb-0">Avg: ${formatCurrency(product.average_price)}</p>
                </td>
                <td class="align-middle text-right text-sm">
                    <p class="text-sm font-weight-bold mb-0">${formatCurrency(product.net_profit)}</p>
                </td>
            `;
            ui.topProductsTableBody.appendChild(row);
        });
    }

    function populateTopProductsByRevenue(products) {
        if (!ui.topProductsByRevenueTableBody) return;

        // Clear existing rows
        ui.topProductsByRevenueTableBody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="align-middle text-left text-sm">
                    <p class="text-sm font-weight-bold mb-0">${product.name}</p>
                    <p class="text-xs text-secondary mb-0">Code: ${product.code}</p>
                </td>
                <td class="align-middle text-center text-sm">
                    <p class="text-sm font-weight-bold mb-0">${product.quantity_sold}</p>
                </td>
                <td class="align-middle text-right text-sm">
                    <p class="text-sm font-weight-bold mb-0">${formatCurrency(product.total_revenue)}</p>
                    <p class="text-xs text-secondary mb-0">Avg: ${formatCurrency(product.average_price)}</p>
                </td>
                <td class="align-middle text-right text-sm">
                    <p class="text-sm font-weight-bold mb-0">${formatCurrency(product.net_profit)}</p> 
                </td>
            `;
            ui.topProductsByRevenueTableBody.appendChild(row);
        });
    }
    
    function populateTopCustomersByCredit(customers) {
        if (!ui.topCustomersByCreditTableBody) return;

        // Clear existing rows
        ui.topCustomersByCreditTableBody.innerHTML = '';

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="align-middle text-left text-sm">
                    <p class="text-sm font-weight-bold mb-0">${customer.customer_name}</p> 
                </td>
                <td class="align-middle text-right text-sm">
                    <p class="text-sm font-weight-bold mb-0">${formatCurrency(customer.value)}</p>
                </td>
            `;
            ui.topCustomersByCreditTableBody.appendChild(row);
        });
    }

    
    function populateTopCustomersByPoint(customers) {
        if (!ui.topCustomersByPointTableBody) return;

        // Clear existing rows
        ui.topCustomersByPointTableBody.innerHTML = '';

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="align-middle text-left text-sm">
                    <p class="text-sm font-weight-bold mb-0">${customer.customer_name}</p> 
                </td>
                <td class="align-middle text-center text-sm">
                    <p class="text-sm font-weight-bold mb-0">${(customer.value)}</p>
                </td>
            `;
            ui.topCustomersByPointTableBody.appendChild(row);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
