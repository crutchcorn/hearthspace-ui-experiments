export type HandwritingPoint = { x: number; y: number }

export const HANDWRITING_STROKE_WIDTH = 2.5

/** Rasterize only the ink, with a small white margin and no shell decoration. */
export function handwritingImage(strokes: HandwritingPoint[][]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const stroke of strokes)
    for (const point of stroke) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
        throw new RangeError('Handwriting points must be finite.')
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  if (!Number.isFinite(minX)) return null
  const padding = Math.max(8, (maxY - minY) * 0.2)
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  if (!Number.isFinite(width) || !Number.isFinite(height))
    throw new RangeError('Handwriting bounds must be finite.')
  const scale = Math.min(2, 2048 / width, 512 / height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.min(2048, Math.ceil(width * scale)))
  canvas.height = Math.max(1, Math.min(512, Math.ceil(height * scale)))
  const context = canvas.getContext('2d')
  if (!context)
    throw new Error('The handwriting pad is unavailable in this browser.')

  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.scale(scale, scale)
  context.translate(padding - minX, padding - minY)
  context.strokeStyle = '#000'
  context.fillStyle = '#000'
  context.lineWidth = HANDWRITING_STROKE_WIDTH
  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const stroke of strokes) {
    const first = stroke[0]
    if (!first) continue
    context.beginPath()
    if (stroke.length === 1) {
      context.arc(
        first.x,
        first.y,
        HANDWRITING_STROKE_WIDTH / 2,
        0,
        Math.PI * 2,
      )
      context.fill()
    } else {
      context.moveTo(first.x, first.y)
      for (const point of stroke.slice(1)) context.lineTo(point.x, point.y)
      context.stroke()
    }
  }

  return canvas.toDataURL('image/png')
}
