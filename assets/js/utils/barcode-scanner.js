// barcodeScanner.js
class BarcodeScanner {
    constructor(targetInputId, callback) {
        this.targetInput = document.getElementById(targetInputId);
        this.callback = callback;
        this.scannedData = [];

        if (!this.targetInput) {
            throw new Error(`Input element with id "${targetInputId}" not found`);
        }

        this.init();
    }

    init() {
        // Ensure input is always focused for scanner
        this.targetInput.setAttribute("autofocus", true);
        this.targetInput.focus();

        // Listen for changes (scanner usually sends Enter at the end)
        this.targetInput.addEventListener("change", (e) => {
            const code = e.target.value.trim();
            if (code) {
                const entry = {
                    barcode: code,
                    timestamp: new Date().toISOString()
                };
                this.scannedData.push(entry);

                // Trigger callback with latest entry + full dataset
                if (typeof this.callback === "function") {
                    this.callback(entry, this.scannedData);
                }
            }
            // Clear for next scan
            e.target.value = "";
        });
    }
}

// Example usage in your web app
// HTML: <input type="text" id="barcodeInput" placeholder="Scan barcode here" />

const scanner = new BarcodeScanner("barcodeInput", (entry, allData) => {
    console.log("New scan:", entry);
    console.log("All scanned data:", allData);

    // Example: send to server or update UI
    // fetch("/api/barcodes", { method: "POST", body: JSON.stringify(entry) });
});
