import { Check } from 'lucide-react'
import { useId, type CSSProperties } from 'react'
import {
  ACCENT_THEMES,
  type AccentThemeId,
  type AppPresentation,
} from '../theme'
import type { BackgroundFit, BackgroundPhoto } from '../useBackground'
import BackgroundSettings from './BackgroundSettings'
import styles from './AppearanceSettings.module.css'

interface AppearanceSettingsProps {
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
}

const APP_PRESENTATIONS = [
  { id: 'ideal', name: 'Ideal', detail: 'Uniform icons and window frames.' },
  {
    id: 'realistic',
    name: 'Realistic',
    detail: 'Mixed app icons and window styles.',
  },
] as const

export default function AppearanceSettings({
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
}: AppearanceSettingsProps) {
  const groupName = useId()
  const presentationGroupName = useId()
  const batterySettingId = useId()

  return (
    <section className={styles.appearance}>
      <header className={styles.heading}>
        <h2>Appearance</h2>
        <p>Your desktop, color, and app presentation.</p>
      </header>
      <BackgroundSettings
        background={background}
        backgroundBusy={backgroundBusy}
        backgroundError={backgroundError}
        onBackgroundUpload={onBackgroundUpload}
        onBackgroundFitChange={onBackgroundFitChange}
        onBackgroundReset={onBackgroundReset}
      />
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
                onChange={() => onAppPresentationChange(presentation.id)}
              />
              <span className={`${styles.card} ${styles.presentationCard}`}>
                <span className={styles.presentationTitle}>
                  <strong>{presentation.name}</strong>
                  <span className={styles.selectionMark} aria-hidden="true">
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
                    <Check size={17} strokeWidth={2} aria-hidden="true" />
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
    </section>
  )
}
