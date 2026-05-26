// dashboard.js
import { API_BASE_URL, configReady } from './config.js';
import { apiFetch } from './utils/api.js';
import { loadNavMenu } from './utils/nav.js';

(async function() {
    async function initDashboard() {
        await configReady;
        console.log('Dashboard JS loaded');
        loadNavMenu();
        
        // Initialize charts after nav is ready
        await initCharts();
    }


    async function initCharts() { 
        try {
            // Call your backend API
            const response = await apiFetch(`${API_BASE_URL}/transactions/dashboard/perday`); 
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
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
