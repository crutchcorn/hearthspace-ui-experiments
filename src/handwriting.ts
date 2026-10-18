import {
  isHandwritingImage,
  type HandwritingRequest,
  type HandwritingResponse,
  type HandwritingStatus,
} from './handwriting-protocol.ts'

export type { HandwritingStatus } from './handwriting-protocol.ts'

interface RecognitionOptions {
  onStatus?: (status: HandwritingStatus) => void
  signal?: AbortSignal
}

interface PendingRecognition {
  requestId: number
  onStatus?: (status: HandwritingStatus) => void
  resolve: (text: string) => void
  reject: (reason: Error) => void
  detachAbort: () => void
}

let worker: Worker | null = null
let nextRequestId = 0
let pending: PendingRecognition | null = null

function takePending() {
  const current = pending
  pending = null
  current?.detachAbort()
  return current
}

function failWorker(instance: Worker, message: string) {
  if (worker !== instance) return
  instance.terminate()
  worker = null
  takePending()?.reject(new Error(message))
}

function getWorker() {
  if (worker) return worker

  const instance = new Worker(
    new URL('./handwriting.worker.ts', import.meta.url),
    {
      type: 'module',
    },
  )
  worker = instance

  instance.addEventListener(
    'message',
    (event: MessageEvent<HandwritingResponse>) => {
      if (worker !== instance) return
      const message = event.data

      // A failed ONNX initialization/inference may poison its internal promise
      // chain. Retry with a fresh worker, keeping the browser's downloaded cache.
      if (message.type === 'error') {
        failWorker(instance, message.message)
        return
      }
      if (pending?.requestId !== message.requestId) return

      if (message.type === 'status') {
        pending.onStatus?.(message.status)
      } else {
        takePending()?.resolve(message.text)
      }
    },
  )
  instance.addEventListener('error', (event) => {
    event.preventDefault()
    failWorker(instance, 'Handwriting recognition could not start. Try again.')
  })
  instance.addEventListener('messageerror', () => {
    failWorker(
      instance,
      'Handwriting recognition stopped unexpectedly. Try again.',
    )
  })

  return instance
}

/** Cancel pending work without unloading the model or clearing its cache. */
export function cancelHandwritingRecognition() {
  const current = takePending()
  if (!current) return

  const message: HandwritingRequest = {
    type: 'cancel',
    requestId: ++nextRequestId,
  }
  worker?.postMessage(message)
  current.reject(
    new DOMException('Handwriting recognition cancelled.', 'AbortError'),
  )
}

/**
 * Recognize one cropped line of black handwriting on an opaque white PNG.
 * New requests supersede earlier ones; cancellation rejects with AbortError.
 * The worker downloads its model on first use and keeps the ink on this device.
 */
export function recognizeHandwriting(
  imageDataUrl: string,
  { onStatus, signal }: RecognitionOptions = {},
): Promise<string> {
  if (signal?.aborted) {
    return Promise.reject(
      new DOMException('Handwriting recognition cancelled.', 'AbortError'),
    )
  }
  if (!isHandwritingImage(imageDataUrl)) {
    return Promise.reject(
      new Error('Handwriting recognition needs a PNG from the drawing pad.'),
    )
  }

  cancelHandwritingRecognition()

  return new Promise((resolve, reject) => {
    let instance: Worker
    try {
      instance = getWorker()
    } catch {
      reject(
        new Error('Handwriting recognition is unavailable in this browser.'),
      )
      return
    }

    const requestId = ++nextRequestId
    const abort = () => {
      if (pending?.requestId === requestId) cancelHandwritingRecognition()
    }
    pending = {
      requestId,
      onStatus,
      resolve,
      reject,
      detachAbort: () => signal?.removeEventListener('abort', abort),
    }
    signal?.addEventListener('abort', abort, { once: true })

    const message: HandwritingRequest = {
      type: 'recognize',
      requestId,
      imageDataUrl,
    }
    instance.postMessage(message)
  })
}
