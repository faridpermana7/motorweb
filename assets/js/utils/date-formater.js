export function formatDate(rawDate) {
  const date = new Date(rawDate);
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "numeric",   
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}
