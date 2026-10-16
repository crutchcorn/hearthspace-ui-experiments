export type Bounds = { x: number; y: number; width: number; height: number }
export type DesktopWindow = Bounds & {
  id: string
  title: string
  kind: 'welcome' | 'notes' | 'empty'
  restore?: Bounds
}
export type Workspace = {
  width: number
  height: number
  home: { x: number; y: number }
  windows: DesktopWindow[]
  note: string
}

export const STORAGE_KEY = 'hearthspace-playground-v1'
export const MIN_WIDTH = 280
export const MIN_HEIGHT = 200
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max))

export function createWorkspace(): Workspace {
  const width = Math.max(window.innerWidth, 960)
  const height = Math.max(window.innerHeight, 720)
  const home = { x: width * 4.5, y: height * 4.5 }
  return {
    width: width * 10,
    height: height * 10,
    home,
    note: 'What if a desktop felt a little more like a place?\n\nA place to leave a thought.\nTo spread things out.\nTo pick up right where you left off.\n\nLess switching. More space.',
    windows: [
      {
        id: 'welcome',
        title: 'Welcome home',
        kind: 'welcome',
        x: home.x + width * 0.1,
        y: home.y + height * 0.28,
        width: 460,
        height: 340,
      },
      {
        id: 'notes',
        title: 'A few thoughts',
        kind: 'notes',
        x: home.x + width * 0.59,
        y: home.y + height * 0.17,
        width: 350,
        height: 330,
      },
      {
        id: 'canvas',
        title: 'Room for something new',
        kind: 'empty',
        x: home.x + width * 0.52,
        y: home.y + height * 0.62,
        width: 360,
        height: 230,
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
      value.width > 100000 ||
      value.height > 100000 ||
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
        return {
          ...item,
          width,
          height,
          x: clamp(bounds.x, 0, value.width - width),
          y: clamp(bounds.y, 0, value.height - height),
        }
      })
    return {
      ...value,
      home: {
        x: clamp(value.home.x, 0, value.width - window.innerWidth),
        y: clamp(value.home.y, 0, value.height - window.innerHeight),
      },
      windows,
    }
  } catch {
    return createWorkspace()
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
