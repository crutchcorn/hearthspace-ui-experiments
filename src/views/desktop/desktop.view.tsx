import DesktopUI from './desktop.ui'
import AppLauncher from './components/app-launcher'
import CanvasOverview from './components/canvas-overview'
import CanvasSearch from './components/canvas-search'
import CanvasTools from './components/canvas-tools'
import ClockLayoutControls from './components/clock-layout-controls'
import DesktopCanvas from './components/desktop-canvas'
import DesktopItems from './components/desktop-items'
import DesktopWindow from './components/desktop-window'
import DrawingActions from './components/drawing-actions'
import FrameGuides from './components/frame-guides'
import FramePreviewSlot from './components/frame-preview-slot'
import FrameShell from './components/frame-shell'
import GatherWindows from './components/gather-windows'
import HandwritingPad from './components/handwriting-pad'
import LayoutConfirm from './components/layout-confirm'
import LayoutEditor from './components/layout-editor'
import LayoutItemControls from './components/layout-item-controls'
import LauncherDock from './components/launcher-dock'
import LockScreen from './components/lock-screen'
import NotificationInbox from './components/notification-inbox'
import SystemBar from './components/system-bar'
import WindowContent from './components/window-content'
import WindowSwitcher from './components/window-switcher'
import { useDesktop } from './hooks/use-desktop'
import { useHandwriting } from './hooks/use-handwriting'

function Handwriting({
  query,
  onText,
}: {
  query: string
  onText: (text: string) => void
}) {
  return <HandwritingPad {...useHandwriting(query, onText)} />
}

export default function DesktopView() {
  const {
    surface,
    canvas,
    windows,
    windowContent,
    layoutEditor,
    toolsRemovalWarning,
    pinnedClose,
    drawingActions,
    gathering,
    frame,
    frameItem,
    notifications,
    canvasTools,
    dock,
    systemWidgets,
    launcher,
    overview,
    switcher,
    search,
    lockScreen,
  } = useDesktop()
  const widgets = {
    notifications: <NotificationInbox {...notifications} />,
    tools: <CanvasTools {...canvasTools} />,
    apps: <LauncherDock {...dock} />,
    ...Object.fromEntries(
      systemWidgets.map(({ id, ...statusProps }) => [
        id,
        <SystemBar key={id} id={id} {...statusProps} />,
      ]),
    ),
  }
  const layoutControls = (
    <>
      {layoutEditor && (
        <>
          <FrameGuides {...layoutEditor.guide} layer="outline" />
          <LayoutEditor {...layoutEditor.editor}>
            <LayoutItemControls
              target={layoutEditor.editor.target}
              controls={{
                'widget:clock': <ClockLayoutControls {...layoutEditor.clock} />,
              }}
            />
          </LayoutEditor>
        </>
      )}
      {toolsRemovalWarning && (
        <LayoutConfirm
          title="Keep a way back to your canvas"
          confirmLabel="Open settings"
          {...toolsRemovalWarning}
        >
          Canvas tools can be removed after you enable “Make canvas tools
          hide-able” in Settings. You can find them again with / or Ctrl+K
          search, or restore them from Settings.
        </LayoutConfirm>
      )}
      {pinnedClose && (
        <LayoutConfirm
          title="Close and remove from pinned?"
          confirmLabel="Close and remove"
          destructive
          {...pinnedClose}
        >
          This closes the window and removes it from the frame.
        </LayoutConfirm>
      )}
    </>
  )
  return (
    <DesktopUI {...surface} layoutControls={layoutControls}>
      <DesktopCanvas {...canvas}>
        {windows.map(({ id, frame, settingsNavigation }) => (
          <DesktopWindow key={id} {...frame}>
            <WindowContent
              item={frame.item}
              settingsNavigation={settingsNavigation}
              {...windowContent}
            />
          </DesktopWindow>
        ))}
      </DesktopCanvas>
      {drawingActions && (
        <DrawingActions key={drawingActions.drawing.id} {...drawingActions} />
      )}
      {gathering && <GatherWindows key={gathering.key} {...gathering.props} />}
      <FrameShell
        {...frame}
        widgets={widgets}
        renderItem={(target, edge) => {
          const item = frameItem(target, edge)
          if (!item) return null
          return item.kind === 'item' ? (
            <DesktopItems {...item.props} />
          ) : (
            <FramePreviewSlot {...item.props} />
          )
        }}
      />
      {launcher && <AppLauncher {...launcher} />}
      {overview && <CanvasOverview {...overview} />}
      {switcher && <WindowSwitcher {...switcher} />}
      {search && (
        <CanvasSearch
          key={search.sessionId}
          Handwriting={Handwriting}
          {...search.props}
        />
      )}
      {lockScreen && <LockScreen {...lockScreen} />}
    </DesktopUI>
  )
}
