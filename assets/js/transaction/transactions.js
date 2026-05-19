"use strict";
import { API_BASE_URL, configReady } from '../config.js';
import { apiFetch } from '../utils/api.js';
import { loadNavMenu, loadPageHeader, loadFooter } from '../utils/nav.js';
import { initDataTable } from "../utils/datatables.js";
import { formatDate, formatCurrency, unformatCurrency } from '../utils/data-formater.js';  

(function() {
    // #region variables and constants
    let transactionsTable; // declare at top of file 
    let tax_id = null;
    let tax_value = 0;
    const state = {
        cart: [],
        product:[],
        discount: 0
    };


    const ui = {
        customerSelect: document.getElementById('customerSelect'),
        paymentSelect: document.getElementById('paymentSelect'),
        taxSelect: document.getElementById('taxSelect'),
        itemSelect: document.getElementById('itemSelect'),


        includeTaxCheckbox: document.getElementById('includeTaxCheckbox'),
        addItemButton: document.getElementById('addItemButton'),

        cartTableBody: document.getElementById('cartTableBody'),
        cartItemsCount: document.getElementById('cartItemsCount'),
        cartGrossPrice: document.getElementById('cartGrossPrice'),
        cartTotalPrice: document.getElementById('cartTotalPrice'),
        cartTaxAmount: document.getElementById('cartTaxAmount'),
        discountInput: document.getElementById('discountInput'),

        taxSelectContainer: document.getElementById('taxSelectContainer'),
        taxLabelContainer: document.getElementById('taxLabelContainer'),

    };  
    // #endregion
    
    // #region dropdown loading functions
    async function loadCustomer() { 
        apiFetch(`${API_BASE_URL}/customers`)
            .then(data => {
                console.log('Customers loaded:', data);
                populateCustomers(data);
            })
            .catch(err => {
                console.error('Error loading customers:', err); 
            });
    }
    
    function populateCustomers(data) {
        ui.customerSelect.innerHTML = '<option value="" disabled selected>-- Choose Customer --</option>';  
        
        data.forEach(x => {
            const option = document.createElement('option');
            option.value = x.id;
            option.textContent = x.name;
            customerSelect.appendChild(option);
        });
    }
    // Fetch categories from enum_tables API
    async function loadEnums() {
        try {
        const data = await apiFetch(`${API_BASE_URL}/enum_tables`);
        console.log('Enums loaded:', data);
        populateCategories(data);
        } catch (err) {
        console.error('Error loading enums:', err);
        }
    }

    function populateCategories(enumData) {
        ui.paymentSelect.innerHTML = '<option value="" disabled selected>-- Choose Payment Methods --</option>'; 
        ui.taxSelect.innerHTML = '<option value="" disabled selected>-- Tax --</option>'; 
        
        enumData.forEach(x => {
        if (x.type === 'PaymentMethod') {
            const option = document.createElement('option');
            option.value = x.name.toLowerCase();
            option.textContent = x.name;
            ui.paymentSelect.appendChild(option);
        }
        else if (x.type === 'TAX') {
            const option = document.createElement('option');
            option.value = x.id;              // stays as tax_id
            option.textContent = x.name;      // label shown to user 
            ui.taxSelect.appendChild(option);
        }
        });
    }

    
    async function loadMasterItems() {
        try {
            const data = await apiFetch(`${API_BASE_URL}/items`);
            console.log('Master Items loaded:', data);
            populateMasterItem(data);
        } catch (err) {
        console.error('Error loading enums:', err);
        }
    }

    function populateMasterItem(data) {
        ui.itemSelect.innerHTML = '<option value="" disabled selected>-- Choose Items --</option>';
        
        state.product = data.map(item => ({
            item_id: item.id, //use id because it's from items table, not transaction_items
            code: item.code,
            barcode: item.barcode,
            name: item.name,
            stock: item.stock,
            price: item.selling_price || item.price,
            category: item.category_name?.toLowerCase() || 'filter'
        }));
                
        const $select = $('#itemSelect');
        $select.empty();

        data.forEach(item => {
            $select.append(new Option(item.name, item.id));
        });

        $select.trigger('change'); // refresh Select2
        // data.forEach(x => {
        //     const option = document.createElement('option');
        //     option.value = x.id;
        //     option.textContent = x.name;
        //     itemSelect.appendChild(option);
        // }); 
        
    }
    // #endregion

    // #region datatables
    function displayDatatables() {  
        const columns = [
            { data: "id" },
            { data: "customer_name" },
            { data: "payment_method" }, 
            {
                data: "discount",
                render: data => formatCurrency(data),
                className: "dt-right"
            }, 
            { data: "tax_name",className: "dt-center" }, 
            {
                data: "tax_value",
                render: data => formatCurrency(data),
                className: "dt-right"
            }, 
            {
                data: "total",
                render: data => formatCurrency(data),
                className: "dt-right"
            },  
            {
            data: "created_at",
            render: data => formatDate(data),
            className: "dt-right"
            },
            { data: "created_by" },
            {
            data: "updated_at",
            render: data => formatDate(data),
            className: "dt-right"
            },
            { data: "updated_by" }
        ];

        transactionsTable = initDataTable({
            tableId: "#transactionsTable",
            url: `${API_BASE_URL}/transactions`,
            columns,
            moduleName: "Transaction",
            disableAdd: true, // set to true to hide Add button,
            onAdd: () => openEditModal("add", {}),
            onEdit: rowData => openEditModal("edit", rowData),
            onDelete: id => openDeleteModal(id),
            onSubmit: handleEditSubmit,
            onConfirmDelete: handleDeleteConfirm
        }); 
    } 
    // #endregion
         
    // #region items
     function getItemsbyTransactionId(transactionId) { 
        return apiFetch(`${API_BASE_URL}/transaction_items/${transactionId}`)
            .then(data => {
            console.log('Transaction Items :', data);
            return data; 
            });
        }

    
    function renderCart() {
        ui.cartTableBody.innerHTML = '';
        state.cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-sm font-weight-bold">${index + 1}</td>
            <td class="text-sm">${item.name}</td>
            <td class="text-sm">
            <div class="input-group input-group-sm">
                <button class="btn btn-outline-secondary btn-sm qty-decrease" data-code="${item.code}" type="button"><span>-</span></button>
                <input type="text" class="form-control form-control-sm text-center cashier-quantity-input" value="${item.quantity}" readonly>
                <button class="btn btn-outline-secondary btn-sm qty-increase" data-code="${item.code}" type="button"><span>+</span></button>
            </div>
            </td>
            <td class="text-sm text-end">${formatCurrency(item.price * item.quantity)}</td>
            <td class="text-end">
            <button class="btn btn-link text-danger p-0 remove-item" data-code="${item.code}" type="button"><i class="material-symbols-rounded">close</i></button>
            </td>
        `;
        ui.cartTableBody.appendChild(row);
        });

        // calculatePayable(); // update totals whenever cart changes
    }
    // #endregion
    
    // #region cart functions
    function addToCart(product) {
        const cartItem = state.cart.find(item => item.code === product.code);
        if (cartItem) {
        cartItem.quantity += 1;
        return;
        }
        state.cart.push({ ...product, quantity: 1 });
    }

    function removeFromCart(code) {
        state.cart = state.cart.filter(item => item.code !== code);
    }

    function changeQuantity(code, delta) {
        const item = state.cart.find(i => i.code === code);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity < 1) {
        removeFromCart(code);
        }
    }

    function computeTotals() {
        const gross = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = Number(state.discount) || 0;
        const taxable = Math.max(0, gross - discount); 

        const taxRate = Number(tax_value) || 0; // decimal (0.10 or 0.11)
        const taxAmount = taxable * taxRate;

        const payable = taxable + taxAmount;

        return { gross, discount, taxRate, taxAmount, payable };
    }

    function renderCart() {
        ui.cartTableBody.innerHTML = '';
        state.cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-sm font-weight-bold">${index + 1}</td>
            <td class="text-sm">${item.name}</td>
            <td class="text-sm">
            <div class="input-group input-group-sm">
                <button class="btn btn-outline-secondary btn-sm qty-decrease" data-code="${item.code}" type="button"><span>-</span></button>
                <input type="text" class="form-control form-control-sm text-center cashier-quantity-input" value="${item.quantity}" readonly>
                <button class="btn btn-outline-secondary btn-sm qty-increase" data-code="${item.code}" type="button"><span>+</span></button>
            </div>
            </td>
            <td class="text-sm text-end">${formatCurrency(item.price * item.quantity)}</td>
            <td class="text-end">
            <button class="btn btn-link text-danger p-0 remove-item" data-code="${item.code}" type="button"><i class="material-symbols-rounded">close</i></button>
            </td>
        `;
        ui.cartTableBody.appendChild(row);
        });

        calculatePayable(); // update totals whenever cart changes
    } 

    function calculatePayable() { 
        const totals = computeTotals();
        ui.cartItemsCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        ui.cartGrossPrice.textContent = formatCurrency(totals.gross);
        ui.cartTotalPrice.textContent = formatCurrency(totals.payable); 
        ui.cartTaxAmount.textContent = formatCurrency(totals.taxAmount); 
    }
    // #endregion

    // #region modal
    const openEditModal = (mode, rowData) => {
        state.cart = []; // reset cart state whenever opening modal
        if(mode === "add") {  
            loadCustomer(); // Load customers when opening add modal to populate dropdowns
            
            $("#editId").val(""); 
            $("#customerSelect").val("");
            $("#paymentSelect").val("");
            $("#taxSelect").val("");
            $("#editDiscount").val("");
            $("#editTaxValue").val("");
        }
        else {  
            $("#editId").val(rowData.id); 
            $("#customerSelect").val(rowData.customer_id);
            $("#paymentSelect").val(rowData.payment_method);

            getItemsbyTransactionId(rowData.id).then(transItems => { 
                console.log('Items loaded:', transItems);
                state.cart = transItems.map(ti => ({
                    // id: ti.id,
                    item_id: ti.item_id,
                    code: ti.item_code,
                    barcode: ti.item_barcode,
                    name: ti.item_name,
                    stock: ti.item_stock,
                    quantity: ti.quantity,
                    price: ti.selling_price || ti.price
                }));
                
                ui.includeTaxCheckbox.checked = false;
                if(rowData.tax_id > 0){ 
                    ui.includeTaxCheckbox.checked = true;
                    $("#taxSelect").val(rowData.tax_id);
                    tax_id = rowData.tax_id; // set global tax_id for calculations
                    tax_value = rowData.tax_name ? Number(rowData.tax_name) / 100 : 0; //the rate
                    ui.cartTaxAmount.textContent = formatCurrency(rowData.tax_value);  //already became amount
                }
                ui.discountInput.textContent = formatCurrency(rowData.discount); 
                renderCart();

            });

        }

        $("#editTitle").text(mode === "add" ? "Add Transaction" : "Edit Transaction");
        $("#editModal").modal("show");
    };

    const openDeleteModal = id => {
        $("#deleteId").val(id);
        $("#deleteModal").modal("show");
    };
    // #endregion

    // #region action
    const handleEditSubmit = async e => {
        e.preventDefault();
        const id = $("#editId").val();
        const totals = computeTotals();   // your existing function
        const discountAmount = Number(state.discount) || 0;
        const payload = {
            items: state.cart.map(item => ({
                // id: item.id, // include item ID for existing items, null/undefined for new items
                item_id: item.item_id,
                name: item.name,
                quantity: item.quantity,
                price: item.price, 
            })),
            customer_id: $("#customerSelect").val()
                ? parseInt($("#customerSelect").val(), 10)
                : null, 
            payment_method: $("#paymentSelect").val()
                ? $("#paymentSelect").val()
                : null, 
            subtotal: totals.gross,
            discount: discountAmount,
            total: totals.payable,
            tax_id : tax_id,
            tax_value: totals.taxAmount || 0
        };

        console.log('Sending payload:', payload); // Debug log

        // Basic validation
        if (!payload.customer_id) {
            await alert("Customer is a required field.", "warning");
            return;
        } 

        //id null or empty means add new transaction, otherwise update existing transaction
        if(id === '') {
            try {
                await apiFetch(`${API_BASE_URL}/transactions`, {
                method: "POST",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                transactionsTable.ajax.reload();
            } catch (err) {
                console.error("Add Transaction failed:", err);
            }

        } else {
            try {
                await apiFetch(`${API_BASE_URL}/transactions/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                showSuccess: true
                });
                $("#editModal").modal("hide");
                transactionsTable.ajax.reload();
            } catch (err) {
                console.error("Update failed:", err);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        const id = $("#deleteId").val();

        try {
            await apiFetch(`${API_BASE_URL}/transactions/softdel/${id}`, {
            method: "PUT",
            showSuccess: false
            });
            $("#deleteModal").modal("hide");
            transactionsTable.ajax.reload();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };
    
    function resetSale() {  
        ui.includeTaxCheckbox.checked = false;
        tax_id = null;
        tax_value = 0; 
        ui.discountInput.value = '';
        $("#taxSelect").val("");
        $("#editTaxValue").val("");
    }  
    // #endregion
    

    async function initTransactions() {
        if (!API_BASE_URL) 
            await configReady;
        console.log('Transactions JS loaded');
        loadNavMenu();
        loadPageHeader('Transactions');
        loadFooter();
        displayDatatables();
        await loadEnums();
        await loadCustomer(); 
        await loadMasterItems(); 
                
        // choose parent: modal if present, otherwise body
        const dropdownParent = $('#editModal').length ? $('#editModal') : $(document.body);
        // ensure loadMasterItems() runs before this
        $('#itemSelect').select2({
            placeholder: "Search item...",
            allowClear: true,
            width: 'resolve',
            minimumResultsForSearch: 0 , // always show search box
            width: '90%',  // force full width of the original element
            dropdownParent: dropdownParent
        });


        ui.taxSelect.addEventListener("change", () => { 
            tax_id = ui.taxSelect.value; // foreign key ID
            const selectedOption = ui.taxSelect.options[ui.taxSelect.selectedIndex]; 
            tax_value = selectedOption ? Number(selectedOption.textContent) / 100 : 0;
            calculatePayable(); // recalculate totals when tax changes
        }); 

            
        ui.discountInput.addEventListener('input', () => {
            const raw = ui.discountInput.value.replace(/\D/g, '');
            state.discount = Number(raw) || 0;
            ui.discountInput.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
            renderCart();
        }); 
        
        // ui.paymentSelect.addEventListener("change", () => { 
        //     $("#editPaymentMethod").val(this.value);  
        //     // calculatePayable(); // recalculate totals when tax changes
        // }); 

        // ui.customerSelect.addEventListener('change', function() { 
        //     $("#editCustomerId").val(this.value);  
        // });  

        ui.cartTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            const code = target.dataset.code;
            if (!code) return;

            if (target.classList.contains('qty-decrease')) {
                changeQuantity(code, -1);
                renderCart();
            }
            if (target.classList.contains('qty-increase')) {
                changeQuantity(code, 1);
                renderCart();
            }
            if (target.classList.contains('remove-item')) {
                removeFromCart(code);
                renderCart();
            }
        }); 

        ui.includeTaxCheckbox.addEventListener("change", () => {
            if (ui.includeTaxCheckbox.checked) {
                ui.taxSelect.disabled = false;
                ui.taxSelectContainer.hidden = false;
                ui.taxLabelContainer.hidden = false;
                ui.cartTaxAmount.hidden = false;
            } else {
                ui.taxSelect.disabled = true; 
                ui.taxSelectContainer.hidden = true;
                ui.taxLabelContainer.hidden = true;
                ui.cartTaxAmount.hidden = true;
                resetSale();
            }
            calculatePayable(); // recalculate totals when tax changes
        });

        
        ui.addItemButton.addEventListener("click", () => { 
            const prod = state.product.find(item => item.item_id === parseInt(ui.itemSelect.value)); 
            if(prod){
                addToCart(prod);
                renderCart(); 
            }
        });
    }
      
    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initTransactions();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initTransactions, { once: true });
    } 
})();