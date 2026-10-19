import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Placement moves the host; app contents live for the lifetime of the window. */
export default function WindowHost({
  container,
  children,
}: {
  container: HTMLElement | null
  children: ReactNode
}) {
  const [host] = useState(() => {
    const element = document.createElement('div')
    element.style.display = 'contents'
    return element
  })

  useLayoutEffect(() => {
    container?.append(host)
    return () => host.remove()
  }, [container, host])

  return createPortal(children, host)
}
