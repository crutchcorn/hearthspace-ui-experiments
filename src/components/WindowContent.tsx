import {
  ArrowUpRight,
  FileCode2,
  FileText,
  Folder,
  LockKeyhole,
} from 'lucide-react'
import type { DesktopWindow, Workspace } from '../desktop'
import { APP_CATALOG } from './launcher-apps'
import styles from './WindowContent.module.css'

interface WindowContentProps {
  item: DesktopWindow
  workspace: Workspace
  onNoteChange: (note: string) => void
}

const files = [
  { name: 'Projects', kind: 'Folder', icon: Folder },
  { name: 'References', kind: 'Folder', icon: Folder },
  { name: 'Notes.txt', kind: 'Text document', icon: FileText },
  { name: 'Sketches.svg', kind: 'SVG image', icon: FileCode2 },
]

const bookmarks = [
  { name: 'Documentation', detail: 'Guides and references' },
  { name: 'Reading list', detail: 'Saved for later' },
  { name: 'Local workspace', detail: 'Your starting point' },
]

export default function WindowContent({
  item,
  workspace,
  onNoteChange,
}: WindowContentProps) {
  if (item.kind === 'welcome') {
    return (
      <div className={styles.overview}>
        <header className={styles.fieldHeader}>
          <h2>Field notes</h2>
          <span>/ 01</span>
        </header>
        <div className={styles.fieldSurvey}>
          <div className={styles.windowCount}>
            <strong>{String(workspace.windows.length).padStart(2, '0')}</strong>
            <span>
              Open
              <br />
              windows
            </span>
          </div>
          <div className={styles.blueprint} aria-hidden="true">
            <span className={styles.blueprintAxis} />
            <span className={styles.blueprintWindow} />
            <span className={styles.blueprintWindow} />
            <span className={styles.blueprintWindow} />
            <span className={styles.blueprintOrigin}>0, 0</span>
            <span className={styles.blueprintScale}>X + Y</span>
          </div>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Surface</dt>
            <dd>Continuous</dd>
          </div>
          <div>
            <dt>Canvas dimensions</dt>
            <dd>
              {Math.round(workspace.width).toLocaleString()} ×{' '}
              {Math.round(workspace.height).toLocaleString()}
              <span> px</span>
            </dd>
          </div>
        </dl>
      </div>
    )
  }

  if (item.kind === 'notes') {
    const wordCount = workspace.note.trim()
      ? workspace.note.trim().split(/\s+/).length
      : 0
    return (
      <div className={styles.notes}>
        <header className={styles.documentHeader}>
          <div>
            <span className={styles.eyebrow}>Local document / 01</span>
            <h2>Scratchpad</h2>
          </div>
          <span>.TXT</span>
        </header>
        <textarea
          aria-label="Note content"
          spellCheck={false}
          value={workspace.note}
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <footer className={styles.footer}>
          <span>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span>Saved locally</span>
        </footer>
      </div>
    )
  }

  if (item.appId === 'files' || !item.appId) {
    return (
      <div className={styles.files}>
        <aside className={styles.places} aria-label="Preview file locations">
          <span className={styles.eyebrow}>Places</span>
          <span className={styles.currentPlace}>Workspace</span>
          <span>Recent</span>
          <span>Documents</span>
          <span>Downloads</span>
          <small>
            LOCAL
            <br />
            01 volume
          </small>
        </aside>
        <div className={styles.fileListing}>
          <div className={styles.breadcrumb}>
            <span className={styles.eyebrow}>Workspace / Local</span>
            <h2>Files</h2>
          </div>
          <table className={styles.fileTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
              </tr>
            </thead>
            <tbody>
              {files.map(({ name, kind, icon: Icon }) => (
                <tr key={name}>
                  <td>
                    <span className={styles.fileName}>
                      <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                      {name}
                    </span>
                  </td>
                  <td>{kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer className={styles.footer}>4 items · Preview</footer>
        </div>
      </div>
    )
  }

  if (item.appId === 'terminal') {
    return (
      <div className={styles.terminal}>
        <div className={styles.terminalSession}>
          TERMINAL / LOCAL SESSION 01
        </div>
        <div className={styles.console}>
          <p>
            <span>workspace ~</span> $ pwd
          </p>
          <p className={styles.consoleOutput}>/home/local/workspace</p>
          <p>
            <span>workspace ~</span> $ ls
          </p>
          <p className={styles.directoryList}>
            <span>Projects/</span>
            <span>References/</span>
            <span>Notes.txt</span>
          </p>
          <p>
            <span>workspace ~</span> $ <i className={styles.cursor} />
          </p>
        </div>
        <footer className={styles.footer}>Terminal preview</footer>
      </div>
    )
  }

  if (item.appId === 'browser') {
    return (
      <div className={styles.browser}>
        <div className={styles.addressBar}>
          <LockKeyhole size={12} aria-hidden="true" />
          <span>workspace://start</span>
          <span className={styles.previewLabel}>Preview</span>
        </div>
        <div className={styles.bookmarks}>
          <span className={styles.eyebrow}>Browser / Index</span>
          <h2>Elsewhere.</h2>
          {bookmarks.map((bookmark, index) => (
            <div key={bookmark.name} className={styles.bookmark}>
              <span className={styles.bookmarkIndex}>0{index + 1}</span>
              <div>
                <strong>{bookmark.name}</strong>
                <span>{bookmark.detail}</span>
              </div>
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const app = APP_CATALOG.find((entry) => entry.id === item.appId)
  const Icon = app?.icon ?? FileText
  return (
    <div className={styles.appPreview}>
      <div className={styles.previewHeading}>
        <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2>{app?.name ?? item.title}</h2>
          <p>{app?.description}</p>
        </div>
      </div>
      <dl className={styles.metadata}>
        <div>
          <dt>Status</dt>
          <dd>Interface preview</dd>
        </div>
        <div>
          <dt>Workspace</dt>
          <dd>Local</dd>
        </div>
      </dl>
      <span className={styles.previewRule} aria-hidden="true" />
    </div>
  )
}
