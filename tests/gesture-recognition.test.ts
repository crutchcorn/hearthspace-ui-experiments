import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recognizeGesture } from '../src/gesture-recognition.ts'
import type { GesturePoint, GestureShortcut } from '../src/gestures.ts'

const B: GesturePoint[] = [
  [178, 150],
  [178, 40],
  [215, 40],
  [240, 48],
  [246, 64],
  [238, 82],
  [211, 94],
  [178, 94],
  [218, 94],
  [246, 104],
  [254, 122],
  [245, 140],
  [218, 150],
  [178, 150],
].map(([x, y]) => ({ x, y }))
const Z: GesturePoint[] = [
  [172, 58],
  [254, 58],
  [180, 130],
  [263, 130],
].map(([x, y]) => ({ x, y }))
const N: GesturePoint[] = [
  [179, 143],
  [179, 46],
  [256, 143],
  [256, 46],
].map(([x, y]) => ({ x, y }))
const shortcuts: GestureShortcut[] = [
  { appId: 'browser', points: B },
  { appId: 'terminal', points: Z },
  { appId: 'notes', points: N },
]

function transformed(points: GesturePoint[], scale = 1, dx = 0, dy = 0) {
  return points.map(({ x, y }) => ({ x: x * scale + dx, y: y * scale + dy }))
}

function noisy(points: GesturePoint[]) {
  return points.flatMap((point, index) => {
    const next = points[index + 1]
    if (!next) return [point]
    return Array.from({ length: 8 }, (_, step) => ({
      x:
        point.x +
        ((next.x - point.x) * step) / 8 +
        Math.sin(index * 8 + step) * 2,
      y:
        point.y +
        ((next.y - point.y) * step) / 8 +
        Math.cos(index * 8 + step) * 2,
    }))
  })
}

test('launches each default app from a sparse translated and scaled glyph', () => {
  for (const shortcut of shortcuts) {
    const result = recognizeGesture(
      [transformed(shortcut.points, 1.8, -180, 90)],
      shortcuts,
    )
    assert.equal(result?.appId, shortcut.appId)
    assert.ok(result && result.score >= 0.8 && result.score <= 1)
  }
})

test('accepts modest freehand noise without confusing N and Z', () => {
  for (const shortcut of shortcuts)
    assert.equal(
      recognizeGesture([noisy(shortcut.points)], shortcuts)?.appId,
      shortcut.appId,
    )
})

const roughGestures = [
  {
    name: 'a narrow N with uneven legs and an unfinished final upstroke',
    appId: 'notes',
    strokes: [
      [
        [30, 160],
        [34, 110],
        [28, 67],
        [39, 30],
        [51, 58],
        [72, 108],
        [92, 153],
        [100, 165],
        [101, 117],
        [108, 66],
        [111, 45],
      ],
    ],
  },
  {
    name: 'a wide N with bowed sides and a low diagonal',
    appId: 'notes',
    strokes: [
      [
        [15, 100],
        [10, 70],
        [17, 35],
        [26, 10],
        [52, 35],
        [100, 55],
        [159, 94],
        [172, 106],
        [174, 61],
        [180, 7],
      ],
    ],
  },
  {
    name: 'a tall Z with an uneven diagonal and a short extra tail',
    appId: 'terminal',
    strokes: [
      [
        [25, 20],
        [53, 15],
        [78, 22],
        [101, 18],
        [85, 44],
        [71, 63],
        [45, 100],
        [30, 129],
        [48, 135],
        [85, 133],
        [102, 140],
        [111, 132],
      ],
    ],
  },
  {
    name: 'a wide Z with rounded corners and wavy horizontal strokes',
    appId: 'terminal',
    strokes: [
      [
        [15, 24],
        [70, 22],
        [122, 31],
        [173, 28],
        [156, 43],
        [115, 54],
        [64, 74],
        [32, 92],
        [18, 102],
        [43, 108],
        [104, 98],
        [157, 105],
      ],
    ],
  },
  {
    name: 'a B with lopsided bowls and an open lower endpoint',
    appId: 'browser',
    strokes: [
      [
        [45, 160],
        [40, 110],
        [46, 65],
        [43, 20],
        [68, 18],
        [108, 31],
        [118, 55],
        [106, 72],
        [85, 82],
        [49, 88],
        [80, 86],
        [122, 100],
        [140, 125],
        [127, 150],
        [95, 165],
        [60, 158],
      ],
    ],
  },
  {
    name: 'a B made from three loose strokes with gaps at their joins',
    appId: 'browser',
    strokes: [
      [
        [60, 145],
        [52, 95],
        [57, 45],
        [52, 5],
      ],
      [
        [53, 10],
        [106, 15],
        [130, 38],
        [103, 67],
        [62, 75],
      ],
      [
        [63, 75],
        [112, 79],
        [141, 108],
        [118, 143],
        [79, 150],
        [65, 140],
      ],
    ],
  },
]

for (const gesture of roughGestures)
  test(`recognizes ${gesture.name}`, () => {
    const strokes = gesture.strokes.map((stroke) =>
      stroke.map(([x, y]) => ({ x, y })),
    )
    assert.equal(recognizeGesture(strokes, shortcuts)?.appId, gesture.appId)
  })

test('accepts a mildly tilted gesture without treating orientation as irrelevant', () => {
  const angle = (18 * Math.PI) / 180
  const tilted = N.map(({ x, y }) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  }))
  assert.equal(recognizeGesture([tilted], shortcuts)?.appId, 'notes')
})

test('accepts an N whose final upstroke stops a third of the way short', () => {
  const unfinished = [
    [20, 120],
    [25, 18],
    [108, 126],
    [115, 55],
  ].map(([x, y]) => ({ x, y }))
  assert.equal(recognizeGesture([unfinished], shortcuts)?.appId, 'notes')
})

test('ignores a small trailing flourish on an otherwise recognizable B', () => {
  const flourish = [
    ...B,
    { x: 168, y: 145 },
    { x: 158, y: 153 },
    { x: 160, y: 163 },
  ]
  assert.equal(recognizeGesture([flourish], shortcuts)?.appId, 'browser')
})

test('recognizes a custom vertical mark even when redrawn bowed and unevenly', () => {
  const custom = [
    {
      appId: 'files',
      points: [
        { x: 100, y: 20 },
        { x: 100, y: 140 },
      ],
    },
  ]
  const stroke = [
    [43, 15],
    [39, 35],
    [45, 67],
    [41, 110],
    [46, 148],
  ].map(([x, y]) => ({ x, y }))
  assert.equal(recognizeGesture([stroke], custom)?.appId, 'files')
  assert.equal(
    recognizeGesture(
      [
        [
          { x: 20, y: 50 },
          { x: 150, y: 50 },
        ],
      ],
      custom,
    ),
    null,
  )
})

test('accepts a B drawn as separate stem and bowls in reverse stroke order', () => {
  const strokes = [B.slice(0, 2), B.slice(1, 8), B.slice(7)]
    .reverse()
    .map((stroke) => transformed(stroke.toReversed(), 0.65, 300, -10))
  assert.equal(recognizeGesture(strokes, shortcuts)?.appId, 'browser')
})

test('accepts separately drawn N and Z segments regardless of direction or order', () => {
  for (const shortcut of shortcuts.slice(1)) {
    const points = shortcut.points
    const strokes = [
      [points[3], points[2]],
      [points[1], points[0]],
      [points[2], points[1]],
    ]
    assert.equal(recognizeGesture(strokes, shortcuts)?.appId, shortcut.appId)
  }
})

test('preserves orientation so rotating N cannot launch Notes', () => {
  const rotated = N.map(({ x, y }) => ({ x: -y, y: x }))
  assert.notEqual(recognizeGesture([rotated], shortcuts)?.appId, 'notes')
})

test('leaves an unrecognized circle unassigned', () => {
  const circle = Array.from({ length: 65 }, (_, index) => ({
    x: 200 + 65 * Math.cos((index * Math.PI * 2) / 64),
    y: 100 + 65 * Math.sin((index * Math.PI * 2) / 64),
  }))
  assert.equal(recognizeGesture([circle], shortcuts), null)
})

test('does not turn unrelated polygons, crosses, or scribbles into an app', () => {
  const unknown = [
    [
      [10, 10],
      [120, 10],
      [120, 120],
      [10, 120],
      [10, 10],
    ],
    [
      [60, 10],
      [120, 120],
      [10, 120],
      [60, 10],
    ],
    [
      [20, 20],
      [110, 115],
      [62, 66],
      [110, 20],
      [20, 115],
    ],
    [
      [10, 50],
      [90, 10],
      [20, 90],
      [110, 30],
      [50, 110],
      [10, 25],
      [100, 95],
    ],
  ]
  for (const stroke of unknown)
    assert.equal(
      recognizeGesture([stroke.map(([x, y]) => ({ x, y }))], shortcuts),
      null,
    )
})

test('does not launch from empty input, taps, tiny marks, or invalid coordinates', () => {
  for (const strokes of [
    [],
    [[]],
    [[{ x: 20, y: 20 }]],
    [Array(40).fill({ x: 5, y: 5 })],
    [transformed(B, 0.03)],
    [
      [
        { x: 0, y: 0 },
        { x: NaN, y: 40 },
      ],
    ],
  ])
    assert.equal(recognizeGesture(strokes, shortcuts), null)
})

test('does not connect separated taps into a launchable glyph', () => {
  assert.equal(
    recognizeGesture(
      N.map((point) => [point]),
      shortcuts,
    ),
    null,
  )
})

test('does not invent the diagonal of N between two separate vertical strokes', () => {
  assert.equal(
    recognizeGesture(
      [
        [N[0], N[1]],
        [N[2], N[3]],
      ],
      shortcuts,
    ),
    null,
  )
})

test('rejects the same shape assigned to different apps instead of guessing', () => {
  assert.equal(
    recognizeGesture(
      [N],
      [
        { appId: 'notes', points: N },
        { appId: 'browser', points: transformed(N, 2, 30, -80) },
      ],
    ),
    null,
  )
})

test('leaves input strokes and saved templates untouched', () => {
  const strokes = [noisy(B)]
  const originals = structuredClone({ strokes, shortcuts })
  recognizeGesture(strokes, shortcuts)
  assert.deepEqual({ strokes, shortcuts }, originals)
})
