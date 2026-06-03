/**
 * Formats a number as COP (Colombian Peso) currency.
 * No decimal places — COP has no subunit.
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
