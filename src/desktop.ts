import { APP_CATALOG } from './components/launcher-apps'
import { loadDrawings, type CanvasDrawing } from './drawings'

export type Bounds = { x: number; y: number; width: number; height: number }
export type CanvasTool = 'cursor' | 'pan' | 'select' | 'search' | 'draw'
export type WindowSelectionShape = 'rectangle' | 'freeform'
export type DesktopItem = Bounds & {
  id: string
  title: string
  kind: 'folder' | 'file' | 'app'
  appId: string
}
export type DesktopWindow = Bounds & {
  id: string
  title: string
  kind: 'welcome' | 'notes' | 'empty'
  appId?: string
  dockOrder?: number
  restore?: Bounds
}
export type Workspace = {
  width: number
  height: number
  home: { x: number; y: number }
  windows: DesktopWindow[]
  items: DesktopItem[]
  drawings: CanvasDrawing[]
  note: string
}

export const STORAGE_KEY = 'hearthspace-playground-v1'
export const CANVAS_TOOL_STORAGE_KEY = 'hearthspace-canvas-tool-v1'
export const WINDOW_SELECTION_STORAGE_KEY = 'hearthspace-window-selection-v1'
export const MIN_WIDTH = 280
export const MIN_HEIGHT = 200

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

const INITIAL_NOTE =
  'Interface notes\n\nUse the corners for controls.\nKeep the canvas for work.\n\nTo explore\n- Compare grid and freeform layouts\n- Open a second browser window\n- Record a launch gesture\n\nOne accent color. Clear states.'
const LEGACY_NOTE =
  'What if a desktop felt a little more like a place?\n\nA place to leave a thought.\nTo spread things out.\nTo pick up right where you left off.\n\nLess switching. More space.'
const DEMO_TITLES = new Map([
  ['welcome', { previous: 'Welcome home', current: 'Workspace' }],
  ['notes', { previous: 'A few thoughts', current: 'Scratchpad' }],
  ['canvas', { previous: 'Room for something new', current: 'Files' }],
])

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max))

function createDesktopItems(home: Workspace['home']): DesktopItem[] {
  const items: Pick<DesktopItem, 'id' | 'title' | 'kind' | 'appId'>[] = [
    { id: 'projects', title: 'Projects', kind: 'folder', appId: 'files' },
    { id: 'pictures', title: 'Pictures', kind: 'folder', appId: 'files' },
    { id: 'notes-file', title: 'Notes.txt', kind: 'file', appId: 'notes' },
    ...APP_CATALOG.map((app) => ({
      id: `${app.id}-shortcut`,
      title: app.name,
      kind: 'app' as const,
      appId: app.id,
    })),
  ]
  return items.map((item, index) => ({
    ...item,
    x: home.x + 28 + 104 * Math.floor(index / 4),
    y: home.y + 112 + 104 * (index % 4),
    width: 88,
    height: 96,
  }))
}

function includeAppShortcuts(
  items: DesktopItem[],
  home: Workspace['home'],
  world: { width: number; height: number },
): DesktopItem[] {
  const appIds = new Set<string>()
  const result = items.filter((item) => {
    if (item.kind !== 'app') return true
    if (appIds.has(item.appId)) return false
    appIds.add(item.appId)
    return true
  })
  const itemIds = new Set(result.map((item) => item.id))
  for (const item of createDesktopItems(home)) {
    if (item.kind !== 'app' || appIds.has(item.appId)) continue
    let id = item.id
    let suffix = 2
    while (itemIds.has(id)) id = `${item.id}-${suffix++}`
    itemIds.add(id)
    result.push({
      ...item,
      id,
      x: clamp(item.x, 0, world.width - item.width),
      y: clamp(item.y, 0, world.height - item.height),
    })
  }
  return result
}

function createWorkspace(): Workspace {
  const width = Math.max(window.innerWidth, 960)
  const height = Math.max(window.innerHeight, 720)
  const home = { x: width * 4.5, y: height * 4.5 }
  return {
    width: width * 10,
    height: height * 10,
    home,
    note: INITIAL_NOTE,
    items: createDesktopItems(home),
    drawings: [],
    windows: [
      {
        id: 'welcome',
        title: 'Workspace',
        kind: 'welcome',
        x: home.x + width * 0.1,
        y: home.y + height * 0.19,
        width: 460,
        height: 350,
      },
      {
        id: 'notes',
        title: 'Scratchpad',
        kind: 'notes',
        x: home.x + width * 0.66,
        y: home.y + height * 0.3,
        width: 350,
        height: 360,
      },
      {
        id: 'canvas',
        title: 'Files',
        kind: 'empty',
        appId: 'files',
        x: home.x + width * 0.3,
        y: home.y + height * 0.46,
        width: 480,
        height: 280,
      },
    ],
  }
}

export function loadWorkspace(): Workspace {
  try {
    const value: Workspace = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    if (
      !value ||
      !Number.isFinite(value.width) ||
      !Number.isFinite(value.height) ||
      value.width < 9600 ||
      value.height < 7200 ||
      !Number.isFinite(value.home?.x) ||
      !Number.isFinite(value.home?.y) ||
      typeof value.note !== 'string' ||
      !Array.isArray(value.windows)
    )
      return createWorkspace()
    const ids = new Set<string>()
    const windows = value.windows
      .filter((item) => {
        if (
          !item ||
          typeof item.id !== 'string' ||
          ids.has(item.id) ||
          typeof item.title !== 'string' ||
          !['welcome', 'notes', 'empty'].includes(item.kind) ||
          ![item.x, item.y, item.width, item.height].every(Number.isFinite)
        )
          return false
        ids.add(item.id)
        return true
      })
      .map(({ restore, ...item }) => {
        const bounds =
          restore &&
          [restore.x, restore.y, restore.width, restore.height].every(
            Number.isFinite,
          )
            ? restore
            : item
        const width = clamp(bounds.width, MIN_WIDTH, value.width)
        const height = clamp(bounds.height, MIN_HEIGHT, value.height)
        const demoTitle = DEMO_TITLES.get(item.id)
        const legacyFiles =
          item.id === 'canvas' &&
          item.kind === 'empty' &&
          item.title === 'Room for something new' &&
          !item.appId
        return {
          ...item,
          title:
            demoTitle?.previous === item.title ? demoTitle.current : item.title,
          appId: legacyFiles ? 'files' : item.appId,
          dockOrder:
            typeof item.dockOrder === 'number' &&
            Number.isFinite(item.dockOrder) &&
            item.dockOrder >= 0
              ? item.dockOrder
              : undefined,
          width,
          height,
          x: clamp(bounds.x, 0, value.width - width),
          y: clamp(bounds.y, 0, value.height - height),
        }
      })
    const home = {
      x: clamp(value.home.x, 0, value.width - window.innerWidth),
      y: clamp(value.home.y, 0, value.height - window.innerHeight),
    }
    const itemIds = new Set<string>()
    const knownApps = new Set(APP_CATALOG.map((app) => app.id))
    const items = Array.isArray(value.items)
      ? value.items
          .filter((item) => {
            if (
              !item ||
              typeof item.id !== 'string' ||
              item.id.length === 0 ||
              itemIds.has(item.id) ||
              typeof item.title !== 'string' ||
              item.title.trim().length === 0 ||
              !['folder', 'file', 'app'].includes(item.kind) ||
              !knownApps.has(item.appId) ||
              ![item.x, item.y, item.width, item.height].every(Number.isFinite)
            )
              return false
            itemIds.add(item.id)
            return true
          })
          .map((item) => {
            const width = clamp(item.width, 48, value.width)
            const height = clamp(item.height, 64, value.height)
            return {
              id: item.id,
              title: item.title,
              kind: item.kind,
              appId: item.appId,
              width,
              height,
              x: clamp(item.x, 0, value.width - width),
              y: clamp(item.y, 0, value.height - height),
            }
          })
      : createDesktopItems(home)
    return {
      ...value,
      note: value.note === LEGACY_NOTE ? INITIAL_NOTE : value.note,
      home,
      windows,
      items: includeAppShortcuts(items, home, value),
      drawings: loadDrawings(value.drawings, value),
    }
  } catch {
    return createWorkspace()
  }
}

export function arrangeWindows(
  workspace: Workspace,
  origin: { x: number; y: number },
): Workspace {
  if (workspace.windows.length === 0) return workspace

  const windows = workspace.windows.map(({ restore, ...item }) => ({
    ...item,
    ...restore,
  }))
  const columns = Math.ceil(Math.sqrt(windows.length))
  const rows = Math.ceil(windows.length / columns)
  const cellWidth = Math.max(...windows.map((item) => item.width))
  const cellHeight = Math.max(...windows.map((item) => item.height))
  const gap = 24
  const x = origin.x + 24
  const y = origin.y + 96
  const arranged = new Map(
    windows
      .toSorted((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
      .map((item, index) => [
        item.id,
        {
          ...item,
          x: x + (index % columns) * (cellWidth + gap),
          y: y + Math.floor(index / columns) * (cellHeight + gap),
        },
      ]),
  )

  return {
    ...workspace,
    width: Math.max(workspace.width, x + columns * (cellWidth + gap)),
    height: Math.max(workspace.height, y + rows * (cellHeight + gap)),
    windows: workspace.windows.map((item) => arranged.get(item.id)!),
  }
}

export function resizeBounds(
  bounds: Bounds,
  edge: string,
  dx: number,
  dy: number,
  world: { width: number; height: number },
): Bounds {
  const right = bounds.x + bounds.width
  const bottom = bounds.y + bounds.height
  const x = edge.includes('w')
    ? clamp(bounds.x + dx, 0, right - MIN_WIDTH)
    : bounds.x
  const y = edge.includes('n')
    ? clamp(bounds.y + dy, 0, bottom - MIN_HEIGHT)
    : bounds.y
  return {
    x,
    y,
    width: edge.includes('w')
      ? right - x
      : edge.includes('e')
        ? clamp(bounds.width + dx, MIN_WIDTH, world.width - x)
        : bounds.width,
    height: edge.includes('n')
      ? bottom - y
      : edge.includes('s')
        ? clamp(bounds.height + dy, MIN_HEIGHT, world.height - y)
        : bounds.height,
  }
}
