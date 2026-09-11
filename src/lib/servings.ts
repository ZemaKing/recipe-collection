export function scaleQuantity(
  quantity: number,
  fromServings: number | null | undefined,
  toServings: number,
): number {
  if (!fromServings || fromServings <= 0) return quantity
  return (quantity * toServings) / fromServings
}

// Rounds to 2 decimals and strips trailing zeros (e.g. 1.50 -> "1.5", 2.00 -> "2").
export function formatQuantity(quantity: number): string {
  return Number(quantity.toFixed(2)).toString()
}
