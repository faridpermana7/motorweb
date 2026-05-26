"use strict";
import { API_BASE_URL, configReady } from './config.js';
import { apiFetch } from './utils/api.js';
import { loadNavMenu } from './utils/nav.js';
import { formatDate, formatCurrency, unformatCurrency } from './utils/data-formater.js';
import { applyTranslations } from './utils/translations.js';

(function() {
  // #region Declaration of variables and constants
  let products = []; 
  let isPrint = false; 
  let tax_id = null;
  let tax_value = 0;
  const customerSelect = document.getElementById('customerSelect'); 
  const state = {
    cart: [],
    discount: 0
  };

  const ui = {
    productGrid: document.getElementById('productGrid'),
    productSearch: document.getElementById('productSearch'),
    productCategory: document.getElementById('productCategory'),
    taxSelect: document.getElementById('taxSelect'),
    barcodeInput: document.getElementById('barcodeInput'),
    barcodeAddButton: document.getElementById('barcodeAddButton'),
    cartTableBody: document.getElementById('cartTableBody'),
    cartItemsCount: document.getElementById('cartItemsCount'),
    cartGrossPrice: document.getElementById('cartGrossPrice'),
    cartTotalPrice: document.getElementById('cartTotalPrice'),
    cartTaxAmount: document.getElementById('cartTaxAmount'),
    discountInput: document.getElementById('discountInput'),
  //   holdSaleButton: document.getElementById('holdSaleButton'),
    paySaleButton: document.getElementById('paySaleButton'),
    cancelSaleButton: document.getElementById('cancelSaleButton'),
    // printSaleButton: document.getElementById('printSaleButton'),
    receiptContainer: document.querySelector('.receipt'),
    isPrintCheckbox: document.getElementById('isPrint'),
    includeTaxCheckbox: document.getElementById('includeTaxCheckbox'),
  };
  
  // #endregion declaration of variables and constants

  // #region dropdown function
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

  function populateCustomers(customerData) {
      // customerSelect.innerHTML = '<option value="">-- Choose --</option>';
      const option = document.createElement('option');
      var defaultCustomer = customerData.find(c => c.name === 'Guest');
      option.value = defaultCustomer.id;
      option.textContent = defaultCustomer.name;
      customerSelect.appendChild(option);
      $("#editCustomerId").val(defaultCustomer.id);   
  }
      
  // Handle type selection change
  customerSelect.addEventListener('change', function() { 
      $("#editCustomerId").val(this.value);  
  }); 
  

  function findProductByBarcode(barcode) {
    return products.find(product => product.barcode === barcode);
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
    ui.productCategory.innerHTML = '<option value="all">All categories</option>'; 
    ui.taxSelect.innerHTML = '<option value="0">TAX</option>'; 
    
    enumData.forEach(x => {
      if (x.type === 'ItemCategory') {
        const option = document.createElement('option');
        option.value = x.name.toLowerCase();
        option.textContent = x.name;
        ui.productCategory.appendChild(option);
      }
      else if (x.type === 'TAX') {
        const option = document.createElement('option');
        option.value = x.id;              // stays as tax_id
        option.textContent = x.name;      // label shown to user 
        ui.taxSelect.appendChild(option);
      }
    });
  }

  
  // #endregion dropdown function

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

  function renderProducts() {
    const query = ui.productSearch.value.trim().toLowerCase();
    const category = ui.productCategory.value; 
    ui.productGrid.innerHTML = ''; 

      apiFetch(`${API_BASE_URL}/items`)
          .then(data => {
              console.log('Items loaded:', data);
              products = data.map(item => ({
                item_id: item.id,
                code: item.code,
                barcode: item.barcode,
                name: item.name,
                stock: item.stock,
                price: item.selling_price || item.price,
                category: item.category_name?.toLowerCase() || 'filter'
              }));
                  
              products
                  .filter(product => {
                  const matchesQuery = product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query);
                  const matchesCategory = category === 'all' || product.category === category;
                  return matchesQuery && matchesCategory;
                  })
                  .forEach(product => {
                  const col = document.createElement('div');
                  col.className = 'col';
                  col.innerHTML = `
                      <div class="card cashier-product-card h-100" data-code="${product.code}"> 
                      <div class="card-body text-center">
                          <div class="cashier-product-image mx-auto">
                          <i class="material-symbols-rounded">camera_alt</i>
                          </div>
                          <h6 class="text-uppercase text-sm mb-1 fw-bold">${product.name}</h6>
                          <p class="text-secondary text-xs mb-2" data-phrase="Barcode">Barcode: ${product.barcode}</p>
                          <p class="text-secondary text-xs mb-2" data-phrase="Stock">Stock: ${product.stock}</p>
                          <div class="text-success fw-bold">${formatCurrency(product.price)}</div>
                      </div>
                      </div>
                  `;
                  ui.productGrid.appendChild(col);

                  const card = col.querySelector('.cashier-product-card');
                  card.addEventListener('click', () => {
                      addToCart(product);
                      renderCart();
                  });
                  });
          })
          .catch(err => {
              console.error('Error loading products:', err); 
          });  
  }

  function calculatePayable() { 
    const totals = computeTotals();
    ui.cartItemsCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    ui.cartGrossPrice.textContent = formatCurrency(totals.gross);
    ui.cartTotalPrice.textContent = formatCurrency(totals.payable); 
    ui.cartTaxAmount.textContent = formatCurrency(totals.taxAmount); 
  }
  // #endregion

  // #region printing and payment functions
  function resetSale() {
    state.cart = [];
    state.discount = 0;
    ui.discountInput.value = '';
    ui.barcodeInput.value = '';
    isPrint = false;
    includeTaxCheckbox.checked = false;
    tax_id = null;
    tax_value = 0;
    renderCart();
  }

  function buildReceiptHtml() {
    const totals = computeTotals();
    const discountAmount = Number(state.discount) || 0;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Thermal printer format (40 chars width for 80mm)
    const WIDTH = 35;
    const separator = '-'.repeat(WIDTH);
    
    // Helper to right-align text
    const rightAlign = (label, value) => {
      const valueStr = String(value);
      const available = WIDTH - label.length - 3; // 3 chars for spacing
      const spacing = Math.max(1, available - valueStr.length);
      return label + ' '.repeat(spacing) + valueStr;
    }; 
    
    const WIDTH_I = 38; // Adjust for padding/margins in CSS
    const itemLines = state.cart.map(item => {
      const qty = `${item.quantity}x`;
      const name = item.name; // allow long names, don’t truncate
      const price = formatCurrency(item.price * item.quantity);

      // First line: qty + name
      const firstLine = `${qty} ${name}`;

      // Second line: price right-aligned to WIDTH_I
      const spaces = Math.max(0, WIDTH_I - price.length);
      const secondLine = ' '.repeat(spaces) + price;

      return firstLine + '\n' + secondLine;
    }).join('\n');

      return `
        <div class="receipt">
          <div class="receipt-header">SPAREPART MOTOR HAJI SUKI</div>
          <div class="receipt-sub">
            Jl. Laguna Mandiri I Km. 13<br>
            Rantau Jaya, Sei Durian, Kal-Sel<br>
            Telp: 0812981239213
          </div>
          <pre class="receipt-text">
    ${separator}
    Tgl: ${dateStr} ${timeStr}
    ${separator}
    <span class="receipt-title">BARANG</span>                        <span class="receipt-title">TOTAL</span>
    ${separator}

    ${itemLines}

    ${separator}
    ${rightAlign('Sub Total', formatCurrency(totals.gross))}
    ${rightAlign('Discount', formatCurrency(discountAmount))}
    ${rightAlign('Tax', formatCurrency(totals.taxAmount || 0))}
    ${separator}
    ${rightAlign('TOTAL', formatCurrency(totals.payable))} 
    ${rightAlign('BAYAR', formatCurrency(totals.payable))}
    ${rightAlign('KEMBALI', formatCurrency(0))}
    ${separator}
    </pre>

    <div class="receipt-sub">
    Barang Yang Sudah Dibeli <br>
    Tidak bisa dikembalikan lagi <br>
    Bukti note ini tidak boleh hilang <br>
    </div>

    <div class="receipt-left">
    Terimakasih atas kunjungan anda  <br>

    Kami menjual: <br>
    - Spare Part Motor & Mobil  <br>
    - Aksesoris Motor  <br> 
    - Alat Pertanian  <br>
    - Alat Bangunan  <br>
      </div>
      </div>
      `;
    }

  function showPrintPreview() {
    if (!ui.receiptContainer) {
      showAlert('Receipt container is missing.', 'danger');
      return;
    }

    ui.receiptContainer.innerHTML = buildReceiptHtml();
    const previewContent = document.getElementById('previewContent');
    if (previewContent) {
      previewContent.innerHTML = ui.receiptContainer.innerHTML;
    }

    const modal = new bootstrap.Modal(document.getElementById('printPreviewModal'));
    modal.show();
  }

  async function submitTransaction(payload) {
  try {
    await apiFetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      body: JSON.stringify(payload),
      showSuccess: true
    });

    showAlert(
      `Sale completed. Total payable: ${formatCurrency(computeTotals().payable)}`,
      'success'
    );
    resetSale();
  } catch (err) {
    console.error("Payment failed:", err);
  }
}

  function performPrintAndPayment() { 
    const totals = computeTotals();   // your existing function
    const discountAmount = Number(state.discount) || 0;
    const now = new Date();

    const payload = {
      header: "SPAREPART MOTOR HAJI SUKI",
      date: now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      items: state.cart.map(item => ({
        item_id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price, 
      })),
      subtotal: totals.gross,
      discount: discountAmount,
      total: totals.payable,
      bayar: totals.payable,
      kembali: 0,
      payment_method: "cash",
      tax_id : tax_id,
      tax_value: totals.taxAmount || 0,
      customer_id: $("#editCustomerId").val() || null
    }; 

    if(isPrint) {
      fetch("http://127.0.0.1:3000/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(console.log)
      .catch(console.error);
    } 

    submitTransaction(payload);

  }
  // #endregion

  async function initCashier() {
    if (!API_BASE_URL)
      await configReady;
    console.log('Cashier JS loaded');
    loadNavMenu();
    await loadEnums();
    await loadCustomer();
    renderProducts();
    renderCart();

    ui.productSearch.addEventListener('input', renderProducts);
    ui.productCategory.addEventListener('change', renderProducts);
    ui.discountInput.addEventListener('input', () => {
      const raw = ui.discountInput.value.replace(/\D/g, '');
      state.discount = Number(raw) || 0;
      ui.discountInput.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
      renderCart();
    });

    ui.barcodeAddButton.addEventListener('click', () => {
      const barcode = ui.barcodeInput.value.trim();
      if (!barcode) return;
      const product = findProductByBarcode(barcode);
      if (!product) {
        showAlert('Product not found');
        return;
      }
      addToCart(product);
      ui.barcodeInput.value = '';
      renderCart();
    });

    ui.barcodeInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        ui.barcodeAddButton.click();
      }
    });

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

    ui.cancelSaleButton.addEventListener('click', () => {
      if (confirm('Cancel this sale?')) {
        resetSale();
      }
    }); 
    ui.isPrintCheckbox.addEventListener("change", () => {
      if (ui.isPrintCheckbox.checked) {
        isPrint = true;
      } else {
        isPrint = false;
      }
    });
     ui.includeTaxCheckbox.addEventListener("change", () => {
      if (ui.includeTaxCheckbox.checked) {
        ui.taxSelect.disabled = false;
      } else {
        ui.taxSelect.disabled = true; 
        tax_id = null;
        tax_value = 0;
      }
      calculatePayable(); // recalculate totals when tax changes
    });
    ui.taxSelect.addEventListener("change", () => { 
      tax_id = ui.taxSelect.value; // foreign key ID
      const selectedOption = ui.taxSelect.options[ui.taxSelect.selectedIndex];
      tax_value = selectedOption ? Number(selectedOption.textContent) / 100 : 0;
        
      calculatePayable(); // recalculate totals when tax changes
    });


  //   ui.holdSaleButton.addEventListener('click', () => {
  //     showAlert('Sale held. You can resume later.');
  //   });

    // ui.printSaleButton.addEventListener('click', () => {
    //   showPrintPreview();
    // });

    // Handle confirm print from modal
    const confirmPrintBtn = document.getElementById('confirmPrintBtn');
    if (confirmPrintBtn) {
      confirmPrintBtn.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('printPreviewModal'));
        if (modal) modal.hide();
        
        performPrintAndPayment(); 
      });
    }

    ui.paySaleButton.addEventListener('click', () => {
      if (!state.cart.length) {
        showAlert('Add at least one product to pay.', 'warning');
        return;
      }
      
      showPrintPreview();
      // showAlert(`Sale completed. Total payable: ${formatCurrency(computeTotals().payable)}`, 'success');
      // resetSale();
    });
  }
 
  // Wait for bootstrap.js to finish loading all dependencies
  if (window.appReady !== undefined) {
      // bootstrap.js already fired appReady event
      initCashier();
  } else {
      // Wait for appReady event from bootstrap.js
      window.addEventListener('appReady', initCashier, { once: true });
  } 
})();
