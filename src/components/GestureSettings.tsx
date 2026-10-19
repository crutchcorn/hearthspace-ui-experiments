import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Pencil, Plus, GestureStroke, Trash2 } from '../icons'
import type { GestureShortcut } from '../gestures'
import AppIcon from './AppIcon'
import GesturePad from './GesturePad'
import { APP_CATALOG } from './launcher-apps'
import styles from './GestureSettings.module.css'

interface GestureSettingsProps {
  gestureShortcuts: GestureShortcut[]
  onSaveGestureShortcut: (
    shortcut: GestureShortcut,
    originalAppId?: string,
  ) => void
  onRemoveGestureShortcut: (appId: string) => void
  onScreenChange: () => void
}

function previewBounds(points: GestureShortcut['points']) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return `${left - 16} ${top - 16} ${Math.max(...xs) - left + 32} ${Math.max(...ys) - top + 32}`
}

export default function GestureSettings({
  gestureShortcuts,
  onSaveGestureShortcut,
  onRemoveGestureShortcut,
  onScreenChange,
}: GestureSettingsProps) {
  const [editor, setEditor] = useState<{
    shortcut?: GestureShortcut
  } | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const editButtons = useRef(new Map<string, HTMLButtonElement>())
  const focusAfterEdit = useRef<string | null>(null)

  useEffect(() => {
    if (editor || !focusAfterEdit.current) return
    const target =
      editButtons.current.get(focusAfterEdit.current) ?? addButton.current
    target?.focus({ preventScroll: true })
    focusAfterEdit.current = null
  }, [editor, gestureShortcuts])

  function showEditor(shortcut?: GestureShortcut) {
    setEditor({ shortcut })
    onScreenChange()
  }

  function showList(focusId: string) {
    focusAfterEdit.current = focusId
    setEditor(null)
    onScreenChange()
  }

  if (editor) {
    return (
      <section className={styles.gestures} aria-label="Gesture editor">
        <header className={styles.editorHeader}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Back to gestures"
            title="Back to gestures"
            onClick={() => showList(editor.shortcut?.appId ?? 'add')}
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <h2>{editor.shortcut ? 'Edit gesture' : 'Add gesture'}</h2>
        </header>
        <GesturePad
          mode="editor"
          initialShortcut={editor.shortcut}
          onSaveShortcut={(shortcut) => {
            onSaveGestureShortcut(shortcut, editor.shortcut?.appId)
            showList(shortcut.appId)
          }}
        />
      </section>
    )
  }

  return (
    <section className={styles.gestures} aria-label="App gestures">
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2>Gestures</h2>
          <p>Draw shortcuts for your apps.</p>
        </div>
        <button
          ref={addButton}
          type="button"
          className={styles.addButton}
          onClick={() => showEditor()}
        >
          <Plus size={16} aria-hidden="true" />
          Add gesture
        </button>
      </header>
      {gestureShortcuts.length ? (
        <ul className={styles.list}>
          {gestureShortcuts.map((shortcut, index) => {
            const app = APP_CATALOG.find((item) => item.id === shortcut.appId)
            if (!app) return null
            return (
              <li key={shortcut.appId} className={styles.shortcut}>
                <div className={styles.preview} aria-hidden="true">
                  <svg viewBox={previewBounds(shortcut.points)}>
                    <polyline
                      points={shortcut.points
                        .map((point) => `${point.x},${point.y}`)
                        .join(' ')}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
                <div className={styles.app}>
                  <AppIcon appId={app.id} icon={app.icon} size={22} />
                  <strong>{app.name}</strong>
                </div>
                <div className={styles.actions}>
                  <button
                    ref={(button) => {
                      if (button) editButtons.current.set(app.id, button)
                      else editButtons.current.delete(app.id)
                    }}
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Edit ${app.name} gesture`}
                    title={`Edit ${app.name} gesture`}
                    onClick={() => showEditor(shortcut)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Remove ${app.name} gesture`}
                    title={`Remove ${app.name} gesture`}
                    onClick={() => {
                      focusAfterEdit.current =
                        gestureShortcuts[index + 1]?.appId ??
                        gestureShortcuts[index - 1]?.appId ??
                        'add'
                      onRemoveGestureShortcut(app.id)
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className={styles.empty}>
          <GestureStroke size={28} aria-hidden="true" />
          <strong>No gestures yet</strong>
          <p>Add a gesture and choose the app it opens.</p>
        </div>
      )}
    </section>
  )
}
