export type HandwritingStatus =
  { phase: 'downloading'; progress?: number } | { phase: 'recognizing' }

export type HandwritingRequest =
  | { type: 'recognize'; requestId: number; imageDataUrl: string }
  | { type: 'cancel'; requestId: number }

export type HandwritingResponse =
  | { type: 'status'; requestId: number; status: HandwritingStatus }
  | { type: 'result'; requestId: number; text: string }
  | { type: 'error'; requestId: number; message: string }

export function isHandwritingImage(value: string) {
  return value.startsWith('data:image/png;base64,') && value.length > 22
}
