import {
  clamp,
  type Bounds,
  type DesktopWindow,
  type Workspace,
} from './desktop'
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

function fitSpatialGrid(
  count: number,
  availableWidth: number,
  availableHeight: number,
  hasWindows: boolean,
  captionSpace = 0,
) {
  const initialColumns = Math.max(
    1,
    Math.min(
      count,
      Math.floor((availableWidth + 18) / (hasWindows ? 258 : 114)),
    ),
  )
  const desiredWidth = hasWindows ? 320 : 96
  const desiredHeight = hasWindows ? 216 : 104
  const fitGrid = (columns: number) => {
    const rows = Math.max(1, Math.ceil(count / columns))
    const columnGap = Math.min(18, availableWidth / (columns * 4))
    const rowGap = Math.max(
      captionSpace,
      Math.min(18, availableHeight / (rows * 4)),
    )
    const cellWidth = Math.min(
      desiredWidth,
      (availableWidth - columnGap * (columns - 1)) / columns,
    )
    const cellHeight = Math.max(
      0,
      Math.min(
        desiredHeight,
        (availableHeight - rowGap * (rows - 1) - captionSpace) / rows,
      ),
    )
    return {
      columns,
      rows,
      columnGap,
      rowGap,
      cellWidth,
      cellHeight,
      width: columns * cellWidth + (columns - 1) * columnGap,
      height: rows * cellHeight + (rows - 1) * rowGap + captionSpace,
      score: Math.min(cellWidth / desiredWidth, cellHeight / desiredHeight),
    }
  }
  let grid = fitGrid(initialColumns)
  if (hasWindows) {
    // Add columns only when they make crowded previews larger.
    for (let columns = initialColumns + 1; columns <= count; columns++) {
      const candidate = fitGrid(columns)
      if (candidate.score > grid.score) grid = candidate
    }
  }
  return grid
}

function placeInGrid(
  item: Bounds,
  index: number,
  grid: ReturnType<typeof fitSpatialGrid>,
  origin: { x: number; y: number },
): SearchPlacement {
  const { columns, columnGap, rowGap, cellWidth, cellHeight } = grid
  const scale = Math.min(1, cellWidth / item.width, cellHeight / item.height)
  return {
    x:
      origin.x +
      (index % columns) * (cellWidth + columnGap) +
      (cellWidth - item.width * scale) / 2,
    y:
      origin.y +
      Math.floor(index / columns) * (cellHeight + rowGap) +
      (cellHeight - item.height * scale) / 2,
    scale,
    matches: true,
  }
}

function parkOutsideView(item: Bounds, view: Bounds): SearchPlacement {
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
  const fieldHeight = 54
  const position = {
    x: clamp(
      anchor.x - fieldWidth / 2,
      clearance.side,
      view.width - clearance.side - fieldWidth,
    ),
    y: clamp(
      anchor.y - fieldHeight / 2,
      clearance.top,
      Math.max(clearance.top, view.height - clearance.bottom - fieldHeight),
    ),
    width: fieldWidth,
  }
  const resultsAbove =
    position.y + fieldHeight / 2 >
    (clearance.top + view.height - clearance.bottom) / 2
  const availableWidth = Math.max(1, view.width - clearance.side * 2)
  const availableHeight = Math.max(
    1,
    resultsAbove
      ? position.y - 24 - clearance.top
      : view.height - clearance.bottom - position.y - fieldHeight - 24,
  )
  const grid = fitSpatialGrid(
    results.length,
    availableWidth,
    availableHeight,
    windows.length > 0,
  )
  const resultTop = resultsAbove
    ? position.y - 24 - grid.height
    : position.y + fieldHeight + 24
  const origin = {
    x: view.x + (view.width - grid.width) / 2,
    y: view.y + resultTop,
  }
  const itemIndexes = new Map(items.map((item, index) => [item.id, index]))
  const windowIndexes = new Map(
    windows.map((item, index) => [item.id, items.length + index]),
  )
  return {
    position,
    resultsAbove,
    results,
    items: new Map(
      workspace.items.map((item) => {
        const index = itemIndexes.get(item.id)
        return [
          item.id,
          index === undefined
            ? parkOutsideView(item, view)
            : placeInGrid(item, index, grid, origin),
        ]
      }),
    ),
    windows: new Map(
      workspace.windows.map((item) => {
        const index = windowIndexes.get(item.id)
        return [
          item.id,
          index === undefined
            ? parkOutsideView(item, view)
            : placeInGrid(item, index, grid, origin),
        ]
      }),
    ),
  }
}

export function getWindowSwitcherLayout(
  workspace: Workspace,
  view: Bounds,
  orderedWindows: DesktopWindow[],
) {
  const clearance = getWindowClearance(view.width)
  const availableWidth = Math.max(1, view.width - clearance.side * 2)
  const availableHeight = Math.max(
    1,
    view.height - clearance.top - clearance.bottom,
  )
  const grid = fitSpatialGrid(
    orderedWindows.length,
    availableWidth,
    availableHeight,
    true,
    36,
  )
  const origin = {
    x: view.x + (view.width - grid.width) / 2,
    y: view.y + clearance.top + (availableHeight - grid.height) / 2,
  }
  const indexes = new Map(orderedWindows.map((item, index) => [item.id, index]))
  return {
    items: new Map(
      workspace.items.map((item) => [item.id, parkOutsideView(item, view)]),
    ),
    windows: new Map(
      workspace.windows.map((item) => {
        const index = indexes.get(item.id)
        return [
          item.id,
          index === undefined
            ? parkOutsideView(item, view)
            : placeInGrid(item, index, grid, origin),
        ]
      }),
    ),
  }
}
