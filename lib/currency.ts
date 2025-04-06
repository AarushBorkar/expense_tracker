// Currency formatting utility
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "₹0.00"

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return `₹${numValue.toFixed(2)}`
}

