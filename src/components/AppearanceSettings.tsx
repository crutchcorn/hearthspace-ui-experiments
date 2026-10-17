import { Check } from 'lucide-react'
import { useId, type CSSProperties } from 'react'
import { ACCENT_THEMES, type AccentThemeId } from '../theme'
import styles from './AppearanceSettings.module.css'

interface AppearanceSettingsProps {
  accentTheme: AccentThemeId
  onAccentThemeChange: (theme: AccentThemeId) => void
}

export default function AppearanceSettings({
  accentTheme,
  onAccentThemeChange,
}: AppearanceSettingsProps) {
  const groupName = useId()

  return (
    <section className={styles.appearance}>
      <header className={styles.heading}>
        <h2>Appearance</h2>
        <p>One accent across your desktop.</p>
      </header>
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
    </section>
  )
}
