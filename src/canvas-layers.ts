// Canvas work shares one stack. Frame attachments live outside that stack.
export const CANVAS_LAYERS = {
  background: 0,
  backgroundWindow: 1,
  raised: 5,
  window: 10,
} as const
