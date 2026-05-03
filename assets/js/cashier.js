import { API_BASE_URL, configReady } from './config.js';
import { apiFetch } from './utils/api.js';
import { loadNavMenu } from './utils/nav.js';
import { formatDate, formatCurrency, unformatCurrency } from './utils/data-formater.js';

let products = [];

const state = {
  cart: [],
  discount: 0
};

const ui = {
  productGrid: document.getElementById('productGrid'),
  productSearch: document.getElementById('productSearch'),
  productCategory: document.getElementById('productCategory'),
  barcodeInput: document.getElementById('barcodeInput'),
  barcodeAddButton: document.getElementById('barcodeAddButton'),
  cartTableBody: document.getElementById('cartTableBody'),
  cartItemsCount: document.getElementById('cartItemsCount'),
  cartGrossPrice: document.getElementById('cartGrossPrice'),
  cartTotalPrice: document.getElementById('cartTotalPrice'),
  discountInput: document.getElementById('discountInput'),
//   holdSaleButton: document.getElementById('holdSaleButton'),
  paySaleButton: document.getElementById('paySaleButton'),
  cancelSaleButton: document.getElementById('cancelSaleButton'),
  printSaleButton: document.getElementById('printSaleButton'),
  receiptContainer: document.querySelector('.receipt'),
};

// function formatCurrency(value) {
//   if (!value && value !== 0) return 'IDR 0';
//   return 'IDR ' + value.toLocaleString();
// }

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
  
  enumData.forEach(x => {
    if (x.type === 'ItemCategory') {
      const option = document.createElement('option');
      option.value = x.name.toLowerCase();
      option.textContent = x.name;
      ui.productCategory.appendChild(option);
    }
  });
}

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
  const payable = Math.max(0, gross - discount);
  return { gross, payable };
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

  const totals = computeTotals();
  ui.cartItemsCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  ui.cartGrossPrice.textContent = formatCurrency(totals.gross);
  ui.cartTotalPrice.textContent = formatCurrency(totals.payable);
}

function renderProducts() {
  const query = ui.productSearch.value.trim().toLowerCase();
  const category = ui.productCategory.value; 
  ui.productGrid.innerHTML = ''; 

    apiFetch(`${API_BASE_URL}/items`)
        .then(data => {
            console.log('Items loaded:', data);
            products = data.map(item => ({
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
                        <p class="text-secondary text-xs mb-2">Barcode: ${product.barcode} | Stock ${product.stock}</p>
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

function resetSale() {
  state.cart = [];
  state.discount = 0;
  ui.discountInput.value = '';
  ui.barcodeInput.value = '';
  renderCart();
}

function buildReceiptHtml() {
  const totals = computeTotals();
  const discountAmount = Number(state.discount) || 0;
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Thermal printer format (32 chars width for 80mm)
  const WIDTH = 32;
  const separator = '-'.repeat(WIDTH);
  
  // Helper to right-align text
  const rightAlign = (label, value) => {
    const valueStr = String(value);
    const available = WIDTH - label.length - 3; // 3 chars for spacing
    const spacing = Math.max(1, available - valueStr.length);
    return label + ' '.repeat(spacing) + valueStr;
  };
  
  // Item lines - format: qty x name on first line, price right-aligned on second line
  const itemLines = state.cart.map(item => {
    const qty = `${item.quantity}x`;
    const price = formatCurrency(item.price * item.quantity);
    const name = item.name.substring(0, 22);
    const firstLine = qty + ' ' + name;
    const secondLine = ' '.repeat(WIDTH - price.length) + price;
    return firstLine + '\n' + secondLine;
  }).join('\n');

  const receiptText = `SPAREPART MOTOR HAJI SUKI
${separator}
Tgl: ${dateStr} ${timeStr}
${separator}
BARANG                       TOTAL
${separator}   

${itemLines}

${separator}
${rightAlign('Sub Total', formatCurrency(totals.gross))}
${rightAlign('Discount', formatCurrency(discountAmount))}
${separator}
${rightAlign('TOTAL', formatCurrency(totals.payable))}
${rightAlign('BAYAR', formatCurrency(totals.payable))}
${rightAlign('KEMBALI', formatCurrency(0))}
${separator}

Terimakasih atas kunjungan
anda

Kami melayani:
- Service
- Spare Part
- Aksesoris Motor`;

  return `<pre class="receipt-text">${receiptText}</pre>`;
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

function performPrint() { 
  const totals = computeTotals();   // your existing function
  const discountAmount = Number(state.discount) || 0;
  const now = new Date();

  const payload = {
    header: "SPAREPART MOTOR HAJI SUKI",
    date: now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    items: state.cart.map(item => ({
      name: item.name,
      qty: item.quantity,
      price: item.price
    })),
    subtotal: totals.gross,
    discount: discountAmount,
    total: totals.payable,
    bayar: totals.payable,
    kembali: 0
  };

  fetch("http://127.0.0.1:3000/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
}

async function initCashier() {
  if (!API_BASE_URL)
    await configReady;
  console.log('Cashier JS loaded');
  loadNavMenu();
  await loadEnums();
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

//   ui.holdSaleButton.addEventListener('click', () => {
//     showAlert('Sale held. You can resume later.');
//   });

  ui.printSaleButton.addEventListener('click', () => {
    showPrintPreview();
  });

  // Handle confirm print from modal
  const confirmPrintBtn = document.getElementById('confirmPrintBtn');
  if (confirmPrintBtn) {
    confirmPrintBtn.addEventListener('click', () => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('printPreviewModal'));
      if (modal) modal.hide();
      performPrint(); 
    });
  }

  ui.paySaleButton.addEventListener('click', () => {
    if (!state.cart.length) {
      showAlert('Add at least one product to pay.', 'warning');
      return;
    }
    showAlert(`Sale completed. Total payable: ${formatCurrency(computeTotals().payable)}`, 'success');
    resetSale();
  });
}

(async function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCashier);
  } else {
    await initCashier();
  }
})();

