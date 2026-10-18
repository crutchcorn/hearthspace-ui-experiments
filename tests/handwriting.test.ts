import assert from 'node:assert/strict'
import { after, afterEach, before, test } from 'node:test'
import {
  cancelHandwritingRecognition,
  recognizeHandwriting,
} from '../src/handwriting.ts'
import type {
  HandwritingRequest,
  HandwritingResponse,
  HandwritingStatus,
} from '../src/handwriting-protocol.ts'

const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='

// Exercise the real client against its external Worker message boundary.
// Model accuracy and browser rasterization remain browser integration checks.
class RecognitionWorker extends EventTarget {
  static instances: RecognitionWorker[] = []
  messages: HandwritingRequest[] = []
  terminated = false

  constructor() {
    super()
    RecognitionWorker.instances.push(this)
  }

  postMessage(message: HandwritingRequest) {
    this.messages.push(message)
  }

  terminate() {
    this.terminated = true
  }

  respond(message: HandwritingResponse) {
    this.dispatchEvent(new MessageEvent('message', { data: message }))
  }

  latestRequest() {
    const message = this.messages.findLast(
      (message) => message.type === 'recognize',
    )
    assert.ok(message)
    return message
  }
}

const originalWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker')

before(() => {
  Object.defineProperty(globalThis, 'Worker', {
    configurable: true,
    writable: true,
    value: RecognitionWorker,
  })
})

afterEach(() => {
  cancelHandwritingRecognition()
  for (const worker of RecognitionWorker.instances)
    worker.dispatchEvent(new Event('messageerror'))
  RecognitionWorker.instances = []
})

after(() => {
  if (originalWorker)
    Object.defineProperty(globalThis, 'Worker', originalWorker)
  else Reflect.deleteProperty(globalThis, 'Worker')
})

function currentWorker() {
  const worker = RecognitionWorker.instances.at(-1)
  assert.ok(worker)
  return worker
}

test('loads recognition only when requested and delivers its text and progress', async () => {
  assert.equal(RecognitionWorker.instances.length, 0)
  const statuses: HandwritingStatus[] = []
  const result = recognizeHandwriting(image, {
    onStatus: (status) => statuses.push(status),
  })
  const worker = currentWorker()
  const request = worker.latestRequest()
  assert.equal(request.imageDataUrl, image)

  worker.respond({
    type: 'status',
    requestId: request.requestId,
    status: { phase: 'downloading', progress: 42 },
  })
  worker.respond({
    type: 'status',
    requestId: request.requestId,
    status: { phase: 'recognizing' },
  })
  worker.respond({
    type: 'result',
    requestId: request.requestId,
    text: 'notes',
  })

  assert.equal(await result, 'notes')
  assert.deepEqual(statuses, [
    { phase: 'downloading', progress: 42 },
    { phase: 'recognizing' },
  ])
  assert.equal(worker.terminated, false)
})

test('new ink supersedes old recognition without allowing stale text or status through', async () => {
  const firstStatuses: HandwritingStatus[] = []
  const first = recognizeHandwriting(image, {
    onStatus: (status) => firstStatuses.push(status),
  })
  const firstAborted = assert.rejects(first, { name: 'AbortError' })
  const worker = currentWorker()
  const firstId = worker.latestRequest().requestId
  const latestStatuses: HandwritingStatus[] = []
  const latest = recognizeHandwriting(image, {
    onStatus: (status) => latestStatuses.push(status),
  })
  const latestId = worker.latestRequest().requestId
  let latestSettled = false
  void latest.then(() => {
    latestSettled = true
  })

  await firstAborted
  assert.equal(RecognitionWorker.instances.length, 1)
  assert.equal(worker.messages[1].type, 'cancel')
  assert.notEqual(firstId, latestId)
  worker.respond({
    type: 'status',
    requestId: firstId,
    status: { phase: 'recognizing' },
  })
  worker.respond({ type: 'result', requestId: firstId, text: 'old query' })
  await Promise.resolve()
  assert.equal(latestSettled, false)
  assert.deepEqual(firstStatuses, [])
  assert.deepEqual(latestStatuses, [])

  worker.respond({ type: 'result', requestId: latestId, text: 'new query' })
  assert.equal(await latest, 'new query')
})

test('cancelling for a typed edit discards late OCR while retaining the loaded worker', async () => {
  const controller = new AbortController()
  const result = recognizeHandwriting(image, { signal: controller.signal })
  const aborted = assert.rejects(result, { name: 'AbortError' })
  const worker = currentWorker()
  const cancelledId = worker.latestRequest().requestId
  controller.abort()
  await aborted
  assert.equal(worker.messages.at(-1)?.type, 'cancel')
  assert.equal(worker.terminated, false)
  worker.respond({ type: 'result', requestId: cancelledId, text: 'stale ink' })

  const next = recognizeHandwriting(image)
  assert.equal(RecognitionWorker.instances.length, 1)
  worker.respond({
    type: 'result',
    requestId: worker.latestRequest().requestId,
    text: 'files',
  })
  assert.equal(await next, 'files')
})

test('an older signal cannot cancel recognition started afterward', async () => {
  const controller = new AbortController()
  const first = recognizeHandwriting(image, { signal: controller.signal })
  const firstAborted = assert.rejects(first, { name: 'AbortError' })
  const latest = recognizeHandwriting(image)
  await firstAborted
  const worker = currentWorker()
  const messageCount = worker.messages.length
  controller.abort()
  assert.equal(worker.messages.length, messageCount)
  worker.respond({
    type: 'result',
    requestId: worker.latestRequest().requestId,
    text: 'terminal',
  })
  assert.equal(await latest, 'terminal')
})

test('invalid images and already-cancelled work never start a model download', async () => {
  await assert.rejects(
    recognizeHandwriting('https://example.com/ink.png'),
    /PNG/,
  )
  await assert.rejects(recognizeHandwriting('data:image/png;base64,'), /PNG/)
  await assert.rejects(
    recognizeHandwriting(image, { signal: AbortSignal.abort() }),
    { name: 'AbortError' },
  )
  cancelHandwritingRecognition()
  assert.equal(RecognitionWorker.instances.length, 0)
})

test('invalid input does not interrupt another valid recognition', async () => {
  const result = recognizeHandwriting(image)
  const worker = currentWorker()
  await assert.rejects(recognizeHandwriting(''), /PNG/)
  assert.equal(worker.messages.length, 1)
  worker.respond({
    type: 'result',
    requestId: worker.latestRequest().requestId,
    text: 'browser',
  })
  assert.equal(await result, 'browser')
})

test('worker failure permits a fresh retry and ignores the failed worker afterward', async () => {
  const first = recognizeHandwriting(image)
  const failed = assert.rejects(first, /Could not load handwriting/)
  const oldWorker = currentWorker()
  oldWorker.respond({
    type: 'error',
    requestId: oldWorker.latestRequest().requestId,
    message: 'Could not load handwriting recognition. Try again.',
  })
  await failed
  assert.equal(oldWorker.terminated, true)

  const retry = recognizeHandwriting(image)
  const worker = currentWorker()
  assert.notEqual(worker, oldWorker)
  const requestId = worker.latestRequest().requestId
  oldWorker.respond({ type: 'result', requestId, text: 'stale result' })
  oldWorker.respond({ type: 'error', requestId, message: 'late error' })
  worker.respond({ type: 'result', requestId, text: 'notes' })
  assert.equal(await retry, 'notes')
  assert.equal(worker.terminated, false)
})

test('a broken worker channel rejects pending work instead of leaving it busy', async () => {
  const result = recognizeHandwriting(image)
  const failed = assert.rejects(result, /stopped unexpectedly/)
  const worker = currentWorker()
  worker.dispatchEvent(new Event('messageerror'))
  await failed
  assert.equal(worker.terminated, true)
})
