export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString + "T00:00:00");
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function formatRoleName(role: string): string {
  return role.replace(/_/g, " ");
}

export function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
