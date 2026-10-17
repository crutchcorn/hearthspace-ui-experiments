import {
  Check,
  Image,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  SlidersHorizontal,
  Spline,
  Sun,
} from 'lucide-react'
import { useId, useRef, useState, type CSSProperties } from 'react'
import {
  ACCENT_THEMES,
  type AccentThemeId,
  type AppPresentation,
  type ColorMode,
} from '../theme'
import type { BackgroundFit, BackgroundPhoto } from '../useBackground'
import type { GestureShortcut } from '../gestures'
import { INITIAL_DISPLAY_LAYOUT } from '../display-layout'
import BackgroundSettings from './BackgroundSettings'
import DisplaySettings, { type DisplayPreferences } from './DisplaySettings'
import GestureSettings from './GestureSettings'
import styles from './Settings.module.css'

interface SettingsProps {
  colorMode: ColorMode
  onColorModeChange: (mode: ColorMode) => void
  accentTheme: AccentThemeId
  onAccentThemeChange: (theme: AccentThemeId) => void
  appPresentation: AppPresentation
  onAppPresentationChange: (presentation: AppPresentation) => void
  showBatteryPercentage: boolean
  onShowBatteryPercentageChange: (show: boolean) => void
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

const APP_PRESENTATIONS = [
  { id: 'ideal', name: 'Ideal', detail: 'Uniform icons and window frames.' },
  {
    id: 'realistic',
    name: 'Realistic',
    detail: 'Mixed app icons and window styles.',
  },
] as const

const CATEGORIES = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Color and app presentation.',
    icon: Palette,
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
    icon: Image,
  },
  {
    id: 'gestures',
    label: 'Gestures',
    description: 'Draw shortcuts for your apps.',
    icon: Spline,
  },
  {
    id: 'system',
    label: 'System',
    description: 'What appears in your system tray.',
    icon: SlidersHorizontal,
  },
] as const

export default function Settings({
  colorMode,
  onColorModeChange,
  accentTheme,
  onAccentThemeChange,
  appPresentation,
  onAppPresentationChange,
  showBatteryPercentage,
  onShowBatteryPercentageChange,
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
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]['id']>('appearance')
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
  const presentationGroupName = useId()
  const batterySettingId = useId()
  const activeCategory = CATEGORIES.find((item) => item.id === category)!

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
            <PanelLeft size={16} strokeWidth={1.6} aria-hidden="true" />
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
              <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
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
                gestureShortcuts={gestureShortcuts}
                onSaveGestureShortcut={onSaveGestureShortcut}
                onRemoveGestureShortcut={onRemoveGestureShortcut}
                onScreenChange={() => content.current?.scrollTo({ top: 0 })}
              />
            )}
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
                        <span className={`${styles.card} ${styles.modeCard}`}>
                          <span className={styles.modeLabel}>
                            <Icon
                              size={18}
                              strokeWidth={1.6}
                              aria-hidden="true"
                            />
                            <strong>{name}</strong>
                          </span>
                          <span
                            className={styles.selectionMark}
                            aria-hidden="true"
                          >
                            {colorMode === id && (
                              <Check size={11} strokeWidth={2.5} />
                            )}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className={styles.palette}>
                  <legend>App appearance</legend>
                  <div className={styles.presentationOptions}>
                    {APP_PRESENTATIONS.map((presentation) => (
                      <label key={presentation.id} className={styles.option}>
                        <input
                          type="radio"
                          name={presentationGroupName}
                          value={presentation.id}
                          aria-label={presentation.name}
                          aria-describedby={`${presentationGroupName}-${presentation.id}`}
                          checked={appPresentation === presentation.id}
                          onChange={() =>
                            onAppPresentationChange(presentation.id)
                          }
                        />
                        <span
                          className={`${styles.card} ${styles.presentationCard}`}
                        >
                          <span className={styles.presentationTitle}>
                            <strong>{presentation.name}</strong>
                            <span
                              className={styles.selectionMark}
                              aria-hidden="true"
                            >
                              {appPresentation === presentation.id && (
                                <Check size={11} strokeWidth={2.5} />
                              )}
                            </span>
                          </span>
                          <span
                            id={`${presentationGroupName}-${presentation.id}`}
                            className={styles.presentationDetail}
                          >
                            {presentation.detail}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className={styles.simulationNote}>
                    Realistic mode uses simulated third-party apps.
                  </p>
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
                              <Check
                                size={17}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
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
              <fieldset className={styles.palette}>
                <legend>System tray</legend>
                <label className={styles.toggleRow}>
                  <span className={styles.toggleCopy}>
                    <strong id={`${batterySettingId}-label`}>
                      Show battery percentage
                    </strong>
                    <span id={`${batterySettingId}-description`}>
                      Display the charge beside the battery icon.
                    </span>
                  </span>
                  <input
                    className={styles.toggle}
                    type="checkbox"
                    role="switch"
                    aria-labelledby={`${batterySettingId}-label`}
                    aria-describedby={`${batterySettingId}-description`}
                    checked={showBatteryPercentage}
                    onChange={(event) =>
                      onShowBatteryPercentageChange(event.target.checked)
                    }
                  />
                </label>
              </fieldset>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
