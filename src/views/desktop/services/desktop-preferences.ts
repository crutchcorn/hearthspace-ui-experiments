import type { CanvasTool, WindowSelectionShape } from '../types/desktop'

const CANVAS_TOOL_STORAGE_KEY = 'hearthspace-canvas-tool-v1'
const WINDOW_SELECTION_STORAGE_KEY = 'hearthspace-window-selection-v1'

export function loadCanvasTool(): CanvasTool {
  try {
    const saved = localStorage.getItem(CANVAS_TOOL_STORAGE_KEY)
    if (
      saved === 'pan' ||
      saved === 'select' ||
      saved === 'search' ||
      saved === 'draw'
    )
      return saved
    if (saved === 'lasso') return 'select'
  } catch {
    /* Use the desktop cursor when preferences are unavailable. */
  }
  return 'cursor'
}

export function loadWindowSelectionShape(): WindowSelectionShape {
  try {
    return localStorage.getItem(WINDOW_SELECTION_STORAGE_KEY) === 'freeform'
      ? 'freeform'
      : 'rectangle'
  } catch {
    return 'rectangle'
  }
}

export function saveCanvasTool(tool: CanvasTool) {
  try {
    localStorage.setItem(CANVAS_TOOL_STORAGE_KEY, tool)
  } catch {
    /* Keep the selected tool usable when storage is unavailable. */
  }
}

export function saveWindowSelectionShape(shape: WindowSelectionShape) {
  try {
    localStorage.setItem(WINDOW_SELECTION_STORAGE_KEY, shape)
  } catch {
    /* Keep the selected shape usable when storage is unavailable. */
  }
}
