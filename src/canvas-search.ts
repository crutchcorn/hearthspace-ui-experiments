import { clamp, type Bounds, type Workspace } from './desktop'
import { APP_CATALOG } from './components/launcher-apps'
import { getWindowClearance } from './window-layout'

export interface CanvasSearchResult {
  id: string
  kind: 'item' | 'window'
}

export interface SearchPlacement {
  x: number
  y: number
  scale: number
  matches: boolean
}

export function getCanvasSearchLayout(
  workspace: Workspace,
  view: Bounds,
  anchor: { x: number; y: number },
  query: string,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const matches = (text: string) =>
    words.every((word) => text.toLocaleLowerCase().includes(word))
  const items = workspace.items.filter((item) =>
    matches(`${item.title} ${item.kind}`),
  )
  const windows = words.length
    ? workspace.windows.toReversed().filter((item) => {
        const app = APP_CATALOG.find((entry) => entry.id === item.appId)
        return matches(
          `${item.title} ${app?.name ?? (item.kind === 'notes' ? 'Notes' : '')} window`,
        )
      })
    : []
  const results: CanvasSearchResult[] = [
    ...items.map(({ id }) => ({ id, kind: 'item' as const })),
    ...windows.map(({ id }) => ({ id, kind: 'window' as const })),
  ]
  const clearance = getWindowClearance(view.width)
  const fieldWidth = Math.min(420, view.width - clearance.side * 2)
  const position = {
    x: clamp(
      anchor.x - fieldWidth / 2,
      clearance.side,
      view.width - clearance.side - fieldWidth,
    ),
    y: clamp(
      anchor.y - 26,
      clearance.top,
      Math.max(clearance.top, view.height * 0.3 - 26),
    ),
    width: fieldWidth,
  }
  const availableWidth = Math.max(1, view.width - clearance.side * 2)
  const resultTop = position.y + 76
  const availableHeight = Math.max(
    64,
    view.height - clearance.bottom - resultTop,
  )
  const gap = 18
  const hasWindows = windows.length > 0
  const columns = Math.max(
    1,
    Math.min(
      results.length,
      Math.floor((availableWidth + gap) / (hasWindows ? 258 : 114)),
    ),
  )
  const rows = Math.max(1, Math.ceil(results.length / columns))
  const cellWidth = Math.min(
    hasWindows ? 320 : 96,
    (availableWidth - gap * (columns - 1)) / columns,
  )
  const cellHeight = Math.min(
    hasWindows ? 216 : 104,
    Math.max(1, (availableHeight - gap * (rows - 1)) / rows),
  )
  const left = (view.width - (columns * cellWidth + (columns - 1) * gap)) / 2

  const placement = (item: Bounds, index: number): SearchPlacement => {
    const scale = Math.min(1, cellWidth / item.width, cellHeight / item.height)
    return {
      x:
        view.x +
        left +
        (index % columns) * (cellWidth + gap) +
        (cellWidth - item.width * scale) / 2,
      y:
        view.y +
        resultTop +
        Math.floor(index / columns) * (cellHeight + gap) +
        (cellHeight - item.height * scale) / 2,
      scale,
      matches: true,
    }
  }
  const park = (item: Bounds): SearchPlacement => {
    const centerX = item.x + item.width / 2 - view.x - view.width / 2
    const centerY = item.y + item.height / 2 - view.y - view.height / 2
    const horizontal =
      Math.abs(centerX / view.width) >= Math.abs(centerY / view.height)
    return {
      x: horizontal
        ? centerX < 0
          ? view.x - item.width - 48
          : view.x + view.width + 48
        : item.x,
      y: horizontal
        ? item.y
        : centerY < 0
          ? view.y - item.height - 48
          : view.y + view.height + 48,
      scale: 1,
      matches: false,
    }
  }
  const itemIndexes = new Map(items.map((item, index) => [item.id, index]))
  const windowIndexes = new Map(
    windows.map((item, index) => [item.id, items.length + index]),
  )
  return {
    position,
    results,
    items: new Map(
      workspace.items.map((item) => {
        const index = itemIndexes.get(item.id)
        return [
          item.id,
          index === undefined ? park(item) : placement(item, index),
        ]
      }),
    ),
    windows: new Map(
      workspace.windows.map((item) => {
        const index = windowIndexes.get(item.id)
        return [
          item.id,
          index === undefined ? park(item) : placement(item, index),
        ]
      }),
    ),
  }
}
