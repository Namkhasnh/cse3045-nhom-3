export type CropPosition = { zoom: number; x: number; y: number }
export function cropRectangle(width: number, height: number, aspect: number, position: CropPosition) {
  const w = Math.min(width, height * aspect) / Math.max(1, position.zoom)
  const h = w / aspect
  return { x: (width - w) * Math.min(100, Math.max(0, position.x)) / 100,
    y: (height - h) * Math.min(100, Math.max(0, position.y)) / 100, width: w, height: h }
}
