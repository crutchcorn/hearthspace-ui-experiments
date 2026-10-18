import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handwritingImage } from '../src/handwriting-image.ts'

test('an empty handwriting pad needs no image or browser canvas', () => {
  assert.equal(handwritingImage([]), null)
  assert.equal(handwritingImage([[], []]), null)
})

test('invalid ink coordinates are rejected before a browser image is allocated', () => {
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.throws(() => handwritingImage([[{ x: invalid, y: 5 }]]), {
      name: 'RangeError',
    })
    assert.throws(() => handwritingImage([[{ x: 5, y: invalid }]]), {
      name: 'RangeError',
    })
  }
})

test('finite coordinates whose bounds overflow are rejected before image allocation', () => {
  assert.throws(
    () =>
      handwritingImage([
        [
          { x: -Number.MAX_VALUE, y: 0 },
          { x: Number.MAX_VALUE, y: 10 },
        ],
      ]),
    { name: 'RangeError' },
  )
})
