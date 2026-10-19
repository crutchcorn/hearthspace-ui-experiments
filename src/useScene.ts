import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import type { Bounds, Workspace } from './desktop'
import type { FrameLayout, LayoutTarget, ObjectPlacement } from './frame-layout'
import {
  projectScene,
  removeSceneObject,
  placeSceneObject,
  moveSceneObject,
  groupSceneObjects,
  releaseSceneGroup,
  restoreSceneDrag,
  restoreSceneBackground,
  mergeSceneFrameOverlaps,
  ungroupSceneObject,
  type ScenePlacementOptions,
  type SceneDestination,
  type SceneDragSnapshot,
  type RemovableSceneTarget,
  updateSceneLayout,
  updateSceneWorkspace,
} from './scene'
import { loadScene, saveScene } from './scene-storage'

export type SceneActions = {
  place(
    target: LayoutTarget,
    placement: ObjectPlacement,
    options?: ScenePlacementOptions,
  ): void
  move(target: LayoutTarget, x: number, y: number): void
  group(source: LayoutTarget, target: LayoutTarget, before: boolean): void
  releaseGroup(
    target: LayoutTarget,
    surface: 'canvas' | 'background',
    destinations: SceneDestination[],
  ): void
  restoreDrag(snapshot: SceneDragSnapshot): void
  mergeFrameOverlaps(entries: { target: LayoutTarget; bounds: Bounds }[]): void
  ungroup(
    target: LayoutTarget,
    placements: { target: LayoutTarget; placement: ObjectPlacement }[],
  ): void
}

export default function useScene() {
  const [scene, setScene] = useState(() => {
    const saved = loadScene()
    const view = {
      ...saved.workspace.home,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    return restoreSceneBackground(saved, view)
  })
  const [view, setView] = useState(() => ({
    ...scene.workspace.home,
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const viewRef = useRef(view)
  useLayoutEffect(() => {
    viewRef.current = view
  }, [view])
  const projection = useMemo(() => projectScene(scene, view), [scene, view])
  // Both adapters update the same state queue. A pin, detach, or group change
  // cannot race a separate workspace update and leave two owned positions.
  const setWorkspace = useCallback((action: SetStateAction<Workspace>) => {
    setScene((current) =>
      updateSceneWorkspace(current, action, viewRef.current),
    )
  }, [])
  const setLayout = useCallback((action: SetStateAction<FrameLayout>) => {
    setScene((current) => updateSceneLayout(current, action, viewRef.current))
  }, [])
  const removeObject = useCallback((target: RemovableSceneTarget) => {
    setScene((current) => removeSceneObject(current, target, viewRef.current))
  }, [])
  const sceneActions = useMemo<SceneActions>(
    () => ({
      place: (target, placement, options) =>
        setScene((current) =>
          placeSceneObject(
            current,
            target,
            placement,
            viewRef.current,
            options,
          ),
        ),
      move: (target, x, y) =>
        setScene((current) =>
          moveSceneObject(current, target, x, y, viewRef.current),
        ),
      group: (source, target, before) =>
        setScene((current) =>
          groupSceneObjects(current, source, target, before, viewRef.current),
        ),
      releaseGroup: (target, surface, destinations) =>
        setScene((current) =>
          releaseSceneGroup(
            current,
            target,
            surface,
            destinations,
            viewRef.current,
          ),
        ),
      restoreDrag: (snapshot) =>
        setScene((current) =>
          restoreSceneDrag(current, snapshot, viewRef.current),
        ),
      mergeFrameOverlaps: (entries) =>
        setScene((current) =>
          mergeSceneFrameOverlaps(current, entries, viewRef.current),
        ),
      ungroup: (target, placements) =>
        setScene((current) =>
          ungroupSceneObject(current, target, placements, viewRef.current),
        ),
    }),
    [],
  )
  useEffect(() => {
    const timer = window.setTimeout(() => saveScene(scene), 200)
    return () => window.clearTimeout(timer)
  }, [scene])
  return {
    ...projection,
    setWorkspace,
    setLayout,
    removeObject,
    sceneActions,
    view,
    setView,
  }
}
