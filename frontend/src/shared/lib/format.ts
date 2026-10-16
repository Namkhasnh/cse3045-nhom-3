const vndFormatter = new Intl.NumberFormat('vi-VN')

// Display only. No price, fee, or order-total decisions belong here.
export function formatVnd(value: string): string {
  return `${vndFormatter.format(BigInt(value))}đ`
}

export function formatDistance(metres: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(metres)} m`
}
