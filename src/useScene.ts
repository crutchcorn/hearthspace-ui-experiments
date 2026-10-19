import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import type { Workspace } from './desktop'
import type { FrameLayout } from './frame-layout'
import { transformCanvasWorkspace } from './layout-workspace'
import { restoreBackgroundItems } from './peek-layout'
import {
  createScene,
  projectScene,
  removeSceneObject,
  type RemovableSceneTarget,
  updateSceneLayout,
  updateSceneWorkspace,
} from './scene'
import { loadScene, saveScene } from './scene-storage'

export default function useScene() {
  const [scene, setScene] = useState(() => {
    const saved = loadScene()
    const view = {
      ...saved.workspace.home,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    const { workspace, layout } = projectScene(saved, view)
    return createScene(
      transformCanvasWorkspace(workspace, layout, restoreBackgroundItems),
      layout,
    )
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
  useEffect(() => {
    const timer = window.setTimeout(() => saveScene(scene), 200)
    return () => window.clearTimeout(timer)
  }, [scene])
  return { ...projection, setWorkspace, setLayout, removeObject, view, setView }
}
