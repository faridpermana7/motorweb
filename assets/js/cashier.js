// cashier.js
import { items } from "./items.js";

class Cashier {
    constructor(inputId, cartTableId, totalId) {
        this.input = document.getElementById(inputId);
        this.cartTable = document.getElementById(cartTableId);
        this.totalDisplay = document.getElementById(totalId);
        this.cart = [];
        this.total = 0;

        this.init();
    }

    init() {
        this.input.setAttribute("autofocus", true);
        this.input.focus();

        this.input.addEventListener("change", (e) => {
            const code = e.target.value.trim();
            if (code) {
                this.addItem(code);
            }
            e.target.value = "";
        });
    }

    addItem(barcode) {
        const item = items.find(i => i.barcode === barcode);
        if (!item) {
            alert("Item not found!");
            return;
        }

        this.cart.push(item);
        this.total += item.price;
        this.renderCart();
    }

    renderCart() {
        this.cartTable.innerHTML = "";
        this.cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.barcode}</td>
                <td>${item.price.toLocaleString()}</td>
            `;
            this.cartTable.appendChild(row);
        });

        this.totalDisplay.textContent = "Total: Rp " + this.total.toLocaleString();
    }
}

// Example usage in HTML:
// <input type="text" id="barcodeInput" placeholder="Scan barcode here">
// <table><tbody id="cartTable"></tbody></table>
// <div id="total"></div>

const cashier = new Cashier("barcodeInput", "cartTable", "total");
