// Exact photographs from the approved Figma Make. Decorative, not catalog evidence.
export const homePhotos = {
  feast: '/images/home/photo-1641440615059-42c8ed3af8c8.jpg',
  pho: '/images/home/photo-1582878826629-29b7ad1cdc43.jpg',
  noodles: '/images/home/photo-1555126634-323283e090fa.jpg',
}
export function categoryPhoto(name: string) {
  const text = name.toLocaleLowerCase('vi')
  const photo = text.includes('cơm') ? '1603133872878-684f208fb84b'
    : /bún|phở/.test(text) ? '1582878826629-29b7ad1cdc43'
    : text.includes('bánh mì') ? '1715925717150-2a6d181d8846'
    : /uống|trà|cà phê/.test(text) ? '1622087250339-9295c9ef442b'
    : text.includes('vặt') ? '1562565652-a0d8f0c59eb4' : '1555126634-323283e090fa'
  return `/images/home/photo-${photo}.jpg`
}
