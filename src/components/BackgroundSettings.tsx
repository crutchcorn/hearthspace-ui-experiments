import { ImagePlus, RotateCcw } from '../icons'
import { useId } from 'react'
import type { BackgroundFit, BackgroundPhoto } from '../useBackground'
import styles from './BackgroundSettings.module.css'

interface BackgroundSettingsProps {
  background: BackgroundPhoto | null
  backgroundBusy: boolean
  backgroundError: string | null
  onBackgroundUpload: (file: File) => void
  onBackgroundFitChange: (fit: BackgroundFit) => void
  onBackgroundReset: () => void
}

export default function BackgroundSettings({
  background,
  backgroundBusy,
  backgroundError,
  onBackgroundUpload,
  onBackgroundFitChange,
  onBackgroundReset,
}: BackgroundSettingsProps) {
  const fitId = useId()

  return (
    <fieldset
      className={styles.background}
      disabled={backgroundBusy}
      aria-busy={backgroundBusy}
    >
      <legend>Background</legend>
      <div className={styles.photoRow}>
        <div className={styles.preview} aria-hidden="true">
          {background && <img src={background.url} alt="" />}
        </div>
        <div className={styles.photoDetails}>
          <strong className={styles.filename} title={background?.name}>
            {background?.name ?? 'Canvas dots'}
          </strong>
          <label className={styles.upload}>
            <ImagePlus size={14} aria-hidden="true" />
            <span>
              {backgroundBusy
                ? 'Loading photo…'
                : background
                  ? 'Change photo'
                  : 'Upload photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              aria-label="Upload background photo"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) onBackgroundUpload(file)
              }}
            />
          </label>
        </div>
      </div>
      {background && (
        <div className={styles.controls}>
          <div className={styles.fitRow}>
            <label htmlFor={fitId}>Photo fit</label>
            <select
              id={fitId}
              value={background.fit}
              aria-describedby={`${fitId}-detail`}
              onChange={(event) =>
                onBackgroundFitChange(
                  event.currentTarget.value as BackgroundFit,
                )
              }
            >
              <option value="repeat">Repeat with canvas</option>
              <option value="stretch">Stretch</option>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
            </select>
          </div>
          <p id={`${fitId}-detail`} className={styles.detail}>
            {background.fit === 'repeat'
              ? 'Moves with the canvas.'
              : 'Stays in place as the canvas moves.'}
          </p>
          <button
            type="button"
            className={styles.reset}
            onClick={onBackgroundReset}
          >
            <RotateCcw size={12} aria-hidden="true" />
            Use default background
          </button>
        </div>
      )}
      {backgroundError && (
        <p className={styles.error} role="alert">
          {backgroundError}
        </p>
      )}
    </fieldset>
  )
}
