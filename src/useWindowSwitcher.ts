import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { DesktopWindow } from './desktop'

interface WindowSwitcherOptions {
  enabled?: boolean
  windows: DesktopWindow[]
  activeWindowId: string | null
  onCommit: (id: string) => void
  onOpen: () => void
}

interface SwitchSession {
  ids: string[]
  selectedId: string
}

export default function useWindowSwitcher({
  enabled = true,
  windows,
  activeWindowId,
  onCommit,
  onOpen,
}: WindowSwitcherOptions) {
  const [session, setSession] = useState<SwitchSession | null>(null)
  const currentSession = useRef<SwitchSession | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const pendingFocus = useRef<{ target: HTMLElement | null } | null>(null)

  const cancel = useCallback((restoreFocus = true) => {
    currentSession.current = null
    pendingFocus.current = restoreFocus
      ? { target: previousFocus.current }
      : null
    previousFocus.current = null
    setSession(null)
  }, [])

  useLayoutEffect(() => {
    if (session || !pendingFocus.current) return
    const { target } = pendingFocus.current
    pendingFocus.current = null

    // Window contents become focusable again after the preview is removed.
    let restored = false
    if (
      target?.isConnected &&
      target !== document.body &&
      !target.closest('[inert]')
    ) {
      target.focus({ preventScroll: true })
      restored = document.activeElement === target
    }
    if (!restored)
      document
        .querySelector<HTMLElement>('[data-canvas-viewport]')
        ?.focus({ preventScroll: true })
  }, [session])

  const select = useCallback(
    (id: string) => {
      const current = currentSession.current
      if (!current) return
      const selected = windows.find((item) => item.id === id)
      if (!selected || !current.ids.includes(id)) return
      currentSession.current = null
      previousFocus.current = null
      pendingFocus.current = null
      setSession(null)
      onCommit(id)
    },
    [onCommit, windows],
  )

  const keydown = useEffectEvent((event: KeyboardEvent) => {
    if (!enabled) return
    const current = currentSession.current
    const shortcut =
      event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      !event.getModifierState('AltGraph') &&
      (event.code === 'Digit1' || event.key === '1' || event.key === '!')

    if (!current) {
      if (!shortcut || !windows.length || document.querySelector(':modal'))
        return
      event.preventDefault()
      event.stopPropagation()

      // Keep this order fixed until Control is released, without focusing yet.
      const ids = windows.map((item) => item.id).reverse()
      const activeIndex = activeWindowId ? ids.indexOf(activeWindowId) : -1
      if (activeIndex > 0) ids.unshift(...ids.splice(activeIndex, 1))
      const next = {
        ids,
        selectedId: ids[(event.shiftKey ? ids.length - 1 : 1) % ids.length],
      }
      pendingFocus.current = null
      const focusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      const focusedWindow = focusedElement?.closest('[data-window-id]')
      // A pointer-focused window may differ from the last focused input.
      // Cancellation must not activate that input's previous window.
      previousFocus.current =
        focusedWindow &&
        focusedWindow.getAttribute('data-window-id') !== activeWindowId
          ? activeWindowId
            ? document.querySelector<HTMLElement>(
                `[data-window-id="${CSS.escape(activeWindowId)}"]`,
              )
            : null
          : focusedElement
      currentSession.current = next
      setSession(next)
      onOpen()
      return
    }

    // The switcher owns keyboard input until it commits or is dismissed.
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      cancel()
      return
    }

    const ids = current.ids.filter((id) =>
      windows.some((item) => item.id === id),
    )
    if (!ids.length) {
      cancel()
      return
    }
    const selectedId = ids.includes(current.selectedId)
      ? current.selectedId
      : ids[0]
    if (event.key === 'Enter') {
      select(selectedId)
      return
    }
    if (!shortcut) return

    const index = ids.indexOf(selectedId)
    const next = {
      ids,
      selectedId:
        ids[(index + (event.shiftKey ? -1 : 1) + ids.length) % ids.length],
    }
    currentSession.current = next
    setSession(next)
  })

  const keyup = useEffectEvent((event: KeyboardEvent) => {
    if (!enabled) return
    const current = currentSession.current
    if (!current) return
    event.preventDefault()
    event.stopPropagation()
    if (
      event.ctrlKey ||
      (event.key !== 'Control' &&
        event.code !== 'ControlLeft' &&
        event.code !== 'ControlRight')
    )
      return

    const selectedId = windows.some((item) => item.id === current.selectedId)
      ? current.selectedId
      : current.ids.find((id) => windows.some((item) => item.id === id))
    if (selectedId) select(selectedId)
    else cancel()
  })

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => keydown(event)
    const onKeyup = (event: KeyboardEvent) => keyup(event)
    const onBlur = () => cancel(false)
    const onVisibilityChange = () => {
      if (document.hidden) cancel(false)
    }
    window.addEventListener('keydown', onKeydown, true)
    window.addEventListener('keyup', onKeyup, true)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onKeydown, true)
      window.removeEventListener('keyup', onKeyup, true)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [cancel])

  const switcherWindows =
    session?.ids.flatMap((id) => {
      const item = windows.find((candidate) => candidate.id === id)
      return item ? [item] : []
    }) ?? []
  const selectedId = switcherWindows.some(
    (item) => item.id === session?.selectedId,
  )
    ? session!.selectedId
    : (switcherWindows[0]?.id ?? null)

  return {
    windows: switcherWindows,
    selectedId,
    open: switcherWindows.length > 0,
    select,
    cancel,
  }
}
