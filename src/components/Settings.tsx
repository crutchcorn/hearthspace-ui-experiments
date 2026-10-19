import {
  Processor,
  Check,
  Photo,
  Monitor,
  Moon,
  Appearance,
  PanelLeft,
  FrameLayout,
  RotateCcw,
  Sliders,
  GestureStroke,
  Sun,
} from '../icons'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { ACCENT_THEMES, type AccentThemeId, type ColorMode } from '../theme'
import type { BackgroundFit, BackgroundPhoto } from '../useBackground'
import type { AIControls } from '../useAI'
import type { GestureShortcut } from '../gestures'
import { INITIAL_DISPLAY_LAYOUT } from '../display-layout'
import BackgroundSettings from './BackgroundSettings'
import AISettings from './AISettings'
import DisplaySettings, { type DisplayPreferences } from './DisplaySettings'
import GestureSettings from './GestureSettings'
import styles from './Settings.module.css'

interface SettingsProps {
  navigation?: SettingsNavigationRequest
  ai: AIControls
  colorMode: ColorMode
  onColorModeChange: (mode: ColorMode) => void
  accentTheme: AccentThemeId
  onAccentThemeChange: (theme: AccentThemeId) => void
  allowHideTools: boolean
  onAllowHideToolsChange: (allow: boolean) => void
  onRestoreCanvasTools: () => void
  onChangeLayout: () => void
  background: BackgroundPhoto | null
  backgroundBusy: boolean
  backgroundError: string | null
  onBackgroundUpload: (file: File) => void
  onBackgroundFitChange: (fit: BackgroundFit) => void
  onBackgroundReset: () => void
  gestureShortcuts: GestureShortcut[]
  onSaveGestureShortcut: (
    shortcut: GestureShortcut,
    originalAppId?: string,
  ) => void
  onRemoveGestureShortcut: (appId: string) => void
}

const COLOR_MODES = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
] as const

const CATEGORIES = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Light and color, shaped around your space.',
    icon: Appearance,
  },
  {
    id: 'displays',
    label: 'Displays',
    description: 'Arrange your screens and adjust each display.',
    icon: Monitor,
  },
  {
    id: 'background',
    label: 'Background',
    description: 'A backdrop for your workspace.',
    icon: Photo,
  },
  {
    id: 'gestures',
    label: 'Gestures',
    description: 'Draw shortcuts for your apps.',
    icon: GestureStroke,
  },
  {
    id: 'ai',
    label: 'AI',
    description: 'Find related windows across your canvas.',
    icon: Processor,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Your system tray and canvas controls.',
    icon: Sliders,
  },
] as const

type SettingsCategory = (typeof CATEGORIES)[number]['id']
export type SettingsNavigationRequest = {
  id: string
  category: SettingsCategory
}

export default function Settings({
  navigation,
  ai,
  colorMode,
  onColorModeChange,
  accentTheme,
  onAccentThemeChange,
  allowHideTools,
  onAllowHideToolsChange,
  onRestoreCanvasTools,
  onChangeLayout,
  background,
  backgroundBusy,
  backgroundError,
  onBackgroundUpload,
  onBackgroundFitChange,
  onBackgroundReset,
  gestureShortcuts,
  onSaveGestureShortcut,
  onRemoveGestureShortcut,
}: SettingsProps) {
  const [category, setCategory] = useState<SettingsCategory>(
    navigation?.category ?? 'appearance',
  )
  const [lastNavigationId, setLastNavigationId] = useState(navigation?.id)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [displayLayout, setDisplayLayout] = useState(INITIAL_DISPLAY_LAYOUT)
  const [displayPreferences, setDisplayPreferences] = useState<
    [DisplayPreferences, DisplayPreferences]
  >([
    { resolution: '1920 × 1200', scale: '125%', refreshRate: '60 Hz' },
    { resolution: '2560 × 1440', scale: '100%', refreshRate: '144 Hz' },
  ])
  const navigationToggle = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const navigationId = useId()
  const colorModeGroupName = useId()
  const groupName = useId()
  const canvasToolsSettingId = useId()
  const activeCategory = CATEGORIES.find((item) => item.id === category)!

  if (navigation && navigation.id !== lastNavigationId) {
    setLastNavigationId(navigation.id)
    setCategory(navigation.category)
    setNavigationOpen(false)
  }

  useLayoutEffect(() => {
    if (navigation) content.current?.scrollTo({ top: 0 })
  }, [navigation])

  return (
    <section className={styles.settings} aria-label="Settings">
      <div
        className={styles.layout}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && navigationOpen) {
            event.stopPropagation()
            setNavigationOpen(false)
            navigationToggle.current?.focus({ preventScroll: true })
          }
        }}
      >
        <div className={styles.compactHeader}>
          <button
            ref={navigationToggle}
            type="button"
            className={styles.navigationToggle}
            aria-label="Settings categories"
            aria-expanded={navigationOpen}
            aria-controls={navigationId}
            onClick={() => setNavigationOpen((open) => !open)}
          >
            <PanelLeft size={16} aria-hidden="true" />
            <span>{activeCategory.label}</span>
          </button>
        </div>
        <nav
          id={navigationId}
          aria-label="Settings categories"
          className={styles.sidebar}
          data-open={navigationOpen}
        >
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={styles.category}
              aria-current={category === id ? 'page' : undefined}
              onClick={() => {
                setCategory(id)
                setNavigationOpen(false)
                content.current?.scrollTo({ top: 0 })
                if (navigationToggle.current?.offsetParent) {
                  navigationToggle.current.focus({ preventScroll: true })
                }
              }}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div ref={content} className={styles.content}>
          <div className={styles.page}>
            {category !== 'gestures' && (
              <header className={styles.heading}>
                <h2>{activeCategory.label}</h2>
                <p>{activeCategory.description}</p>
              </header>
            )}
            {category === 'background' && (
              <BackgroundSettings
                background={background}
                backgroundBusy={backgroundBusy}
                backgroundError={backgroundError}
                onBackgroundUpload={onBackgroundUpload}
                onBackgroundFitChange={onBackgroundFitChange}
                onBackgroundReset={onBackgroundReset}
              />
            )}
            {category === 'displays' && (
              <DisplaySettings
                layout={displayLayout}
                onLayoutChange={setDisplayLayout}
                preferences={displayPreferences}
                onPreferencesChange={setDisplayPreferences}
              />
            )}
            {category === 'gestures' && (
              <GestureSettings
                key={lastNavigationId}
                gestureShortcuts={gestureShortcuts}
                onSaveGestureShortcut={onSaveGestureShortcut}
                onRemoveGestureShortcut={onRemoveGestureShortcut}
                onScreenChange={() => content.current?.scrollTo({ top: 0 })}
              />
            )}
            {category === 'ai' && <AISettings ai={ai} />}
            {category === 'appearance' && (
              <>
                <fieldset className={styles.palette}>
                  <legend>Color mode</legend>
                  <div className={styles.presentationOptions}>
                    {COLOR_MODES.map(({ id, name, icon: Icon }) => (
                      <label key={id} className={styles.option}>
                        <input
                          type="radio"
                          name={colorModeGroupName}
                          value={id}
                          aria-label={name}
                          checked={colorMode === id}
                          onChange={() => onColorModeChange(id)}
                        />
                        <span
                          className={`${styles.card} ${styles.modeCard}`}
                          data-mode={id}
                        >
                          <span
                            className={styles.modePreview}
                            aria-hidden="true"
                          >
                            <span className={styles.previewWindow} />
                            <span className={styles.previewPanel} />
                          </span>
                          <span className={styles.modeLabel}>
                            <Icon size={18} aria-hidden="true" />
                            <strong>{name}</strong>
                          </span>
                          <span
                            className={styles.selectionMark}
                            aria-hidden="true"
                          >
                            {colorMode === id && <Check size={11} />}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className={styles.palette}>
                  <legend>Accent color</legend>
                  <div className={styles.options}>
                    {ACCENT_THEMES.map((theme) => (
                      <label key={theme.id} className={styles.option}>
                        <input
                          type="radio"
                          name={groupName}
                          value={theme.id}
                          aria-label={theme.name}
                          checked={accentTheme === theme.id}
                          onChange={() => onAccentThemeChange(theme.id)}
                        />
                        <span className={styles.card}>
                          <span
                            className={styles.swatch}
                            style={{ '--swatch': theme.color } as CSSProperties}
                          >
                            {accentTheme === theme.id && (
                              <Check size={17} aria-hidden="true" />
                            )}
                          </span>
                          <span className={styles.name}>
                            <strong>{theme.name}</strong>
                            {theme.id === 'orange' && <small>Default</small>}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            {category === 'system' && (
              <>
                <fieldset className={styles.palette}>
                  <legend>Frame layout</legend>
                  <p className={styles.layoutDescription}>
                    Arrange and group your frame items, or change how much
                    detail they show.
                  </p>
                  <button
                    type="button"
                    className={styles.restoreTools}
                    onClick={onChangeLayout}
                  >
                    <FrameLayout size={15} aria-hidden="true" />
                    Change layout
                  </button>
                </fieldset>
                <fieldset className={styles.palette}>
                  <legend>Canvas tools</legend>
                  <label className={styles.toggleRow}>
                    <span className={styles.toggleCopy}>
                      <strong id={`${canvasToolsSettingId}-label`}>
                        Make canvas tools hide-able
                      </strong>
                      <span id={`${canvasToolsSettingId}-description`}>
                        Removing canvas tools hides their buttons. Press / or
                        Ctrl+K to find and restore them with search.
                      </span>
                    </span>
                    <input
                      className={styles.toggle}
                      type="checkbox"
                      role="switch"
                      aria-labelledby={`${canvasToolsSettingId}-label`}
                      aria-describedby={`${canvasToolsSettingId}-description`}
                      checked={allowHideTools}
                      onChange={(event) =>
                        onAllowHideToolsChange(event.target.checked)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.restoreTools}
                    onClick={onRestoreCanvasTools}
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    Restore canvas tools
                  </button>
                </fieldset>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
