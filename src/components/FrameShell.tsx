import { Grip } from 'lucide-react'
import type { PointerEvent, ReactNode } from 'react'
import type { Bounds } from '../desktop'
import {
  FRAME_WIDGETS,
  getFrameGroups,
  getPlacement,
  getTargetGroup,
  targetKey,
  type FrameEdge,
  type FrameGroup,
  type FrameLayout,
  type LayoutTarget,
} from '../frame-layout'
import PlacedWidget from './PlacedWidget'
import shellStyles from './ShellControls.module.css'
import styles from './FrameShell.module.css'

interface FrameShellProps {
  canvasHost: HTMLElement | null
  popoverHost: HTMLElement | null
  layout: FrameLayout
  view: Bounds
  editing: boolean
  selected: LayoutTarget | null
  selectedControlIds: string[]
  onControlPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    id: string,
  ) => void
  onControlSizeChange: (
    id: string,
    size: { width: number; height: number },
  ) => void
  draggingWidget: {
    id: string
    edge?: FrameEdge
    center: { x: number; y: number }
  } | null
  groupDropTarget: LayoutTarget | null
  hidden: boolean
  inert: boolean
  widgets: Record<string, ReactNode>
  renderItem: (target: LayoutTarget, edge?: FrameEdge) => ReactNode
}

export default function FrameShell({
  canvasHost,
  popoverHost,
  layout,
  view,
  editing,
  selected,
  selectedControlIds,
  onControlPointerDown,
  onControlSizeChange,
  draggingWidget,
  groupDropTarget,
  hidden,
  inert,
  widgets,
  renderItem,
}: FrameShellProps) {
  const groups = getFrameGroups(layout)
  const matches = (candidate: LayoutTarget | null, target: LayoutTarget) =>
    candidate !== null && targetKey(candidate) === targetKey(target)
  const isDefaultWidget = (id: string) => {
    const target = { kind: 'widget' as const, id }
    const placement = getPlacement(layout, target)
    const original = FRAME_WIDGETS.find((widget) => widget.id === id)
    return (
      !getTargetGroup(layout, target) &&
      placement.surface === 'frame' &&
      placement.edge === original?.defaultPlacement.edge &&
      placement.position === original.defaultPlacement.position
    )
  }
  const system = groups.find((group) => group.id === 'system')
  const systemPlacement = system
    ? getPlacement(layout, { kind: 'group', id: system.id })
    : null
  const mergedTop =
    isDefaultWidget('notifications') &&
    systemPlacement?.surface === 'frame' &&
    systemPlacement.edge === 'top' &&
    systemPlacement.position === 1 &&
    system?.members.map(targetKey).join(',') ===
      'widget:clock,widget:wifi,widget:volume,widget:battery'
  const mergedBottom = isDefaultWidget('tools') && isDefaultWidget('apps')

  function renderWidget(
    id: string,
    merged?: 'top' | 'bottom',
    orientationEdge?: FrameEdge,
    inline = false,
  ) {
    const target = { kind: 'widget' as const, id }
    return (
      <PlacedWidget
        canvasHost={canvasHost}
        popoverHost={popoverHost}
        key={targetKey(target)}
        id={id}
        placement={getPlacement(layout, target)}
        view={view}
        editing={editing}
        selected={matches(selected, target)}
        canvasSelected={selectedControlIds.includes(id)}
        onControlPointerDown={onControlPointerDown}
        onControlSizeChange={onControlSizeChange}
        dropTarget={matches(groupDropTarget, target)}
        hidden={hidden}
        merged={merged}
        inline={inline}
        orientationEdge={orientationEdge}
        draggingWidget={draggingWidget}
      >
        {widgets[id]}
      </PlacedWidget>
    )
  }

  function renderGroup(group: FrameGroup, merged?: 'top' | 'bottom') {
    const target = { kind: 'group' as const, id: group.id }
    const placement = getPlacement(layout, target)
    const edge =
      draggingWidget?.id === group.id
        ? draggingWidget.edge
        : placement.surface === 'frame'
          ? placement.edge
          : undefined
    return (
      <PlacedWidget
        canvasHost={canvasHost}
        popoverHost={popoverHost}
        key={targetKey(target)}
        kind="group"
        id={group.id}
        placement={placement}
        view={view}
        editing={editing}
        selected={matches(selected, target)}
        dropTarget={matches(groupDropTarget, target)}
        hidden={hidden}
        merged={merged}
        draggingWidget={draggingWidget}
      >
        <div
          className={`${styles.group} ${shellStyles.surface}`}
          data-frame-group={group.id}
          data-frame-edge={edge}
          data-merged={merged}
        >
          {editing && (
            <button
              type="button"
              className={styles.grip}
              data-layout-group={group.id}
              aria-label="Move group"
              title="Move group"
            >
              <Grip size={14} aria-hidden="true" />
            </button>
          )}
          <div className={styles.members}>
            {group.members.map((member) =>
              member.kind === 'widget' ? (
                renderWidget(member.id, undefined, edge, true)
              ) : (
                <div
                  key={targetKey(member)}
                  className={styles.itemMember}
                  data-group-member
                  data-member-kind={member.kind}
                  data-group-drop-target={matches(groupDropTarget, member)}
                >
                  {renderItem(member, edge)}
                </div>
              ),
            )}
          </div>
        </div>
      </PlacedWidget>
    )
  }

  return (
    <div className={styles.shell} inert={inert} data-frame-shell>
      {mergedTop && system && (
        <div
          className={`${styles.mobileBar} ${shellStyles.mobileSurface}`}
          data-mobile-bar="top"
          hidden={hidden}
          data-shell-controls
        >
          {renderWidget('notifications', 'top')}
          {renderGroup(system, 'top')}
        </div>
      )}
      {mergedBottom && (
        <div
          className={`${styles.mobileBar} ${shellStyles.mobileSurface}`}
          data-mobile-bar="bottom"
          hidden={hidden}
          data-shell-controls
        >
          {renderWidget('tools', 'bottom')}
          {renderWidget('apps', 'bottom')}
        </div>
      )}
      {FRAME_WIDGETS.filter(
        ({ id }) =>
          !getTargetGroup(layout, { kind: 'widget', id }) &&
          !(mergedTop && id === 'notifications') &&
          !(mergedBottom && (id === 'tools' || id === 'apps')),
      ).map(({ id }) => renderWidget(id))}
      {groups
        .filter((group) => !(mergedTop && group.id === 'system'))
        .map((group) => renderGroup(group))}
    </div>
  )
}
