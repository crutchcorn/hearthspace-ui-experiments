import { useEffect, useState } from 'react'

const CORNER_DISTANCE = 72
const HOVER_GRACE = 450
const TOUCH_GRACE = 2500

function isShellControl(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-shell-controls]')
}

function isWindowChromeButton(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest('[data-window-id][data-focus-mode="true"] > header button')
  )
}

function isNearCorner(event: PointerEvent) {
  return (
    (event.clientX <= CORNER_DISTANCE ||
      event.clientX >= window.innerWidth - CORNER_DISTANCE) &&
    (event.clientY <= CORNER_DISTANCE ||
      event.clientY >= window.innerHeight - CORNER_DISTANCE)
  )
}

export default function useShellPeek(enabled: boolean, keepOpen: boolean) {
  const [peek, setPeek] = useState({ enabled, visible: false })

  // Each entry into focused mode starts with the shell tucked away.
  if (peek.enabled !== enabled) setPeek({ enabled, visible: false })

  useEffect(() => {
    if (!enabled) return

    let hideTimer: number | undefined
    let pointerInShell = false
    let keyboardInShell = false
    let keyboardModality = !!document.activeElement?.matches(':focus-visible')

    const clearTimer = () => {
      window.clearTimeout(hideTimer)
      hideTimer = undefined
    }
    const reveal = () => {
      clearTimer()
      setPeek((current) =>
        current.visible ? current : { ...current, visible: true },
      )
    }
    const hideSoon = (delay = HOVER_GRACE) => {
      if (pointerInShell || keyboardInShell || hideTimer !== undefined) return
      hideTimer = window.setTimeout(() => {
        hideTimer = undefined
        if (document.querySelector('[data-shell-controls] [role="menu"]'))
          return
        setPeek((current) =>
          current.visible ? { ...current, visible: false } : current,
        )
      }, delay)
    }
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointerInShell =
        isShellControl(event.target) ||
        (!isWindowChromeButton(event.target) && isNearCorner(event))
      if (pointerInShell) reveal()
      else hideSoon()
    }
    const pointerDown = (event: PointerEvent) => {
      keyboardModality = false
      keyboardInShell = false
      if (isWindowChromeButton(event.target)) {
        pointerInShell = false
        hideSoon()
        return
      }
      const inRevealArea = isNearCorner(event) || isShellControl(event.target)
      pointerInShell = event.pointerType !== 'touch' && inRevealArea
      if (inRevealArea) {
        reveal()
        if (event.pointerType === 'touch') hideSoon(TOUCH_GRACE)
      } else hideSoon()
    }
    const pointerLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return
      pointerInShell = false
      hideSoon()
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      keyboardModality = true
      keyboardInShell = isShellControl(document.activeElement)
      if (keyboardInShell) reveal()
    }
    const focusIn = (event: FocusEvent) => {
      keyboardInShell = keyboardModality && isShellControl(event.target)
      if (keyboardInShell) reveal()
      else hideSoon()
    }
    const focusOut = (event: FocusEvent) => {
      keyboardInShell = keyboardModality && isShellControl(event.relatedTarget)
      if (!keyboardInShell) hideSoon()
    }
    const blur = () => {
      clearTimer()
      pointerInShell = false
      keyboardInShell = false
      keyboardModality = false
      setPeek((current) => ({ ...current, visible: false }))
    }

    window.addEventListener('pointermove', pointerMove, true)
    window.addEventListener('pointerdown', pointerDown, true)
    window.addEventListener('pointerout', pointerLeave)
    window.addEventListener('keydown', keyDown, true)
    window.addEventListener('focusin', focusIn)
    window.addEventListener('focusout', focusOut)
    window.addEventListener('blur', blur)
    return () => {
      clearTimer()
      window.removeEventListener('pointermove', pointerMove, true)
      window.removeEventListener('pointerdown', pointerDown, true)
      window.removeEventListener('pointerout', pointerLeave)
      window.removeEventListener('keydown', keyDown, true)
      window.removeEventListener('focusin', focusIn)
      window.removeEventListener('focusout', focusOut)
      window.removeEventListener('blur', blur)
    }
  }, [enabled])

  return enabled && (keepOpen || peek.visible)
}
