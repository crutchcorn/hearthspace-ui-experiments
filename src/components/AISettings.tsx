import { ChevronDown } from 'lucide-react'
import { useId, useRef } from 'react'
import type { AIControls } from '../useAI'
import settingsStyles from './Settings.module.css'
import styles from './AISettings.module.css'

interface AISettingsProps {
  ai: AIControls
}

export default function AISettings({ ai }: AISettingsProps) {
  const settingId = useId()
  const confirmation = useRef<HTMLDialogElement>(null)
  const status = ai.downloading
    ? 'Downloading model…'
    : ai.enabled
      ? 'AI features are ready.'
      : 'AI features are off.'

  return (
    <div className={styles.settings}>
      <label className={settingsStyles.toggleRow}>
        <span className={settingsStyles.toggleCopy}>
          <strong id={`${settingId}-label`}>Enable AI features</strong>
        </span>
        <input
          className={settingsStyles.toggle}
          type="checkbox"
          role="switch"
          aria-labelledby={`${settingId}-label`}
          aria-describedby={
            !ai.enabled ? `${settingId}-description` : undefined
          }
          checked={ai.enabled || ai.downloading}
          onChange={(event) => {
            if (ai.enabled && !event.target.checked) {
              confirmation.current?.showModal()
              return
            }
            ai.setEnabled(event.target.checked)
          }}
        />
      </label>
      {!ai.enabled && (
        <p id={`${settingId}-description`} className={styles.detail}>
          {ai.downloading
            ? 'Turn off to cancel the download.'
            : 'Download the 3 GB model to get started.'}
        </p>
      )}
      <div className={styles.status}>
        <p role="status">{status}</p>
        {ai.downloading && (
          <>
            <span className={styles.amount}>
              {((ai.progress / 100) * 3).toFixed(1)} / 3 GB
            </span>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label="AI model download"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ai.progress}
            >
              <span style={{ width: `${ai.progress}%` }} />
            </div>
          </>
        )}
      </div>
      <section className={styles.features}>
        <h3>Features</h3>
        <details className={styles.feature}>
          <summary>
            <span>On-device AI</span>
            <ChevronDown size={14} strokeWidth={1.6} aria-hidden="true" />
          </summary>
          <p>
            AI runs locally on your device. No device information is sent
            off-device.
          </p>
        </details>
        <details className={styles.feature}>
          <summary>
            <span>Gather similar windows</span>
            <ChevronDown size={14} strokeWidth={1.6} aria-hidden="true" />
          </summary>
          <p>
            Select one or more windows, then choose Gather similar windows. AI
            finds related windows on your canvas and brings them into view
            beside your selection.
          </p>
        </details>
      </section>
      <dialog
        ref={confirmation}
        className={styles.confirmation}
        aria-labelledby={`${settingId}-confirmation-title`}
        aria-describedby={`${settingId}-confirmation-description`}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <h3 id={`${settingId}-confirmation-title`}>Turn off AI?</h3>
        <p id={`${settingId}-confirmation-description`}>
          Turning off AI deletes the local 3 GB model. You’ll need to download
          it again to turn AI back on.
        </p>
        <div className={styles.confirmationActions}>
          <button
            type="button"
            autoFocus
            onClick={() => confirmation.current?.close()}
          >
            Keep AI
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => {
              ai.setEnabled(false)
              confirmation.current?.close()
            }}
          >
            Turn off and delete
          </button>
        </div>
      </dialog>
    </div>
  )
}
