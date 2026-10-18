import {
  env,
  pipeline,
  type ImageToTextPipeline,
} from '@huggingface/transformers'
import {
  isHandwritingImage,
  type HandwritingRequest,
  type HandwritingResponse,
  type HandwritingStatus,
} from './handwriting-protocol'

const MODEL = 'Xenova/trocr-small-handwritten'
const REVISION = '2432e24d184b1d964d07ed04f5d9e21d31a59141'

// The app uses DOM types, so keep the worker boundary narrow instead of mixing
// incompatible Window and WebWorker global declarations in its tsconfig.
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<HandwritingRequest>) => void) | null
  postMessage: (message: HandwritingResponse) => void
}

env.allowLocalModels = false
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1

let recognizer: Promise<ImageToTextPipeline> | null = null
let modelReady = false
let latestRequestId = 0
let queued: Extract<HandwritingRequest, { type: 'recognize' }> | null = null
let processing = false
let downloadProgress: number | undefined

function postStatus(status: HandwritingStatus) {
  scope.postMessage({ type: 'status', requestId: latestRequestId, status })
}

function getRecognizer() {
  if (!recognizer) {
    recognizer = pipeline('image-to-text', MODEL, {
      revision: REVISION,
      device: 'wasm',
      dtype: 'q8',
      progress_callback: (progress) => {
        if (progress.status !== 'progress_total') return
        downloadProgress = Math.max(0, Math.min(100, progress.progress))
        postStatus({ phase: 'downloading', progress: downloadProgress })
      },
    }).then((loaded) => {
      modelReady = true
      return loaded
    })
  }
  return recognizer
}

async function processQueue() {
  if (processing) return
  processing = true

  try {
    while (queued) {
      const request = queued
      queued = null
      if (!isHandwritingImage(request.imageDataUrl)) {
        throw new Error(
          'Handwriting recognition needs a PNG from the drawing pad.',
        )
      }

      if (!modelReady)
        postStatus({ phase: 'downloading', progress: downloadProgress })
      const readHandwriting = await getRecognizer()
      if (request.requestId !== latestRequestId) continue

      postStatus({ phase: 'recognizing' })
      const output = await readHandwriting(request.imageDataUrl, {
        do_sample: false,
        num_beams: 1,
        max_new_tokens: 48,
      })
      if (request.requestId !== latestRequestId) continue

      const text = output[0]?.generated_text.replace(/\s+/g, ' ').trim() ?? ''
      scope.postMessage({ type: 'result', requestId: request.requestId, text })
    }
  } catch (error) {
    queued = null
    console.error('Handwriting recognition failed:', error)
    scope.postMessage({
      type: 'error',
      requestId: latestRequestId,
      message: modelReady
        ? 'Could not read this handwriting. Try again with one line of text.'
        : 'Could not load handwriting recognition. Check your connection and try again.',
    })
  } finally {
    processing = false
  }
}

scope.onmessage = ({ data }) => {
  latestRequestId = data.requestId
  if (data.type === 'cancel') {
    queued = null
    return
  }

  queued = data
  if (!modelReady)
    postStatus({ phase: 'downloading', progress: downloadProgress })
  void processQueue()
}
