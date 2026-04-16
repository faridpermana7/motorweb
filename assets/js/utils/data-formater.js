export function formatDate(rawDate) {
  if (!rawDate) return "";

  // Ensure UTC source is parsed correctly
  const date = new Date(rawDate.endsWith("Z") ? rawDate : rawDate + "Z");

  // Convert to local time
  const year   = date.getFullYear();
  const month  = String(date.getMonth() + 1).padStart(2, "0");
  const day    = String(date.getDate()).padStart(2, "0");
  const hour   = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// Format number as Indonesian Rupiah
export function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(value);
} 

// Remove formatting and return raw number
export function unformatCurrency(value) {
  // Remove everything except digits
  let raw = value.replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : 0;
}