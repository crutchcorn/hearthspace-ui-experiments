import type { ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import type { BackgroundPhoto } from './types/background'
import type { Bounds, CanvasTool } from './types/desktop'
import type { AccentThemeId, ColorMode } from './constants/theme'
import styles from './desktop.module.css'

interface DesktopUIProps {
  tool: CanvasTool
  accentTheme: AccentThemeId
  accentColor: string
  colorMode: ColorMode
  inputModality: 'keyboard' | 'pointer'
  photo: BackgroundPhoto | null
  focused: boolean
  previewing: boolean
  previewExiting: boolean
  shellVisible: boolean
  switching: boolean
  view: Bounds
  world: Pick<Bounds, 'width' | 'height'>
  setFrameHost: Ref<HTMLDivElement>
  setPopoverHost: Ref<HTMLDivElement>
  setLayoutDragHost: Ref<HTMLDivElement>
  setPinnedDrawingHost: Ref<HTMLDivElement>
  events: Pick<
    ComponentProps<'main'>,
    | 'onPointerDownCapture'
    | 'onFocusCapture'
    | 'onPointerMove'
    | 'onPointerUp'
    | 'onPointerCancel'
    | 'onLostPointerCapture'
    | 'onClickCapture'
  >
  layoutControls: ReactNode
  children: ReactNode
}

export default function DesktopUI({
  tool,
  accentTheme,
  accentColor,
  colorMode,
  inputModality,
  photo,
  focused,
  previewing,
  previewExiting,
  shellVisible,
  switching,
  view,
  world,
  setFrameHost,
  setPopoverHost,
  setLayoutDragHost,
  setPinnedDrawingHost,
  events,
  layoutControls,
  children,
}: DesktopUIProps) {
  return (
    <main
      className={styles.desktop}
      data-layout-editing={tool === 'layout'}
      {...events}
      data-accent={accentTheme}
      data-color-mode={colorMode}
      data-input-modality={inputModality}
      data-background={photo ? 'photo' : 'dots'}
      data-presentation="realistic"
      data-focus-mode={focused}
      data-canvas-preview={previewing}
      data-preview-exiting={previewExiting}
      data-shell-peek={shellVisible}
      style={{ '--accent-base': accentColor } as CSSProperties}
    >
      <div
        ref={setFrameHost}
        className={styles.frameHost}
        data-shell-controls
      />
      <div
        ref={setPopoverHost}
        className={styles.popoverHost}
        inert={switching || tool === 'layout'}
        data-shell-controls
      />
      <div className={styles.layoutDragOverlay}>
        <div
          ref={setLayoutDragHost}
          className={styles.layoutDragWorld}
          style={{
            left: -view.x,
            top: -view.y,
            width: world.width,
            height: world.height,
          }}
        />
      </div>
      <div ref={setPinnedDrawingHost} className={styles.pinnedDrawingHost} />
      {layoutControls}
      {photo && photo.fit !== 'repeat' && (
        <div
          className={styles.photoBackground}
          data-background-fit={photo.fit}
          aria-hidden="true"
          style={{
            backgroundImage: `url("${photo.url}")`,
            backgroundSize: photo.fit === 'stretch' ? '100% 100%' : photo.fit,
          }}
        />
      )}
      {children}
    </main>
  )
}
