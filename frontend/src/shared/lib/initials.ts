export function initials(name: string) {
  return name.trim().split(/\s+/u).filter(Boolean).slice(-2).map(part => [...part][0]).join('').toLocaleUpperCase('vi-VN') || 'HL'
}
