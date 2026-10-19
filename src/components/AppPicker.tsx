import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from '../icons'
import {
  Button,
  ComboBox,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from 'react-aria-components'
import AppIcon from './AppIcon'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './AppPicker.module.css'

interface AppPickerProps {
  selectedId: string
  onChange: (appId: string) => void
}

export default function AppPicker({ selectedId, onChange }: AppPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()
  const setPickerElement = useCallback((element: HTMLDivElement | null) => {
    if (!element) return
    // Escape scrolling windows while retaining the desktop's theme and icons.
    setPortalContainer(
      element.closest<HTMLElement>('[data-color-mode]') ?? undefined,
    )
  }, [])
  const selectedApp =
    APP_CATALOG.find((app) => app.id === selectedId) ?? APP_CATALOG[0]

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
  }, [])

  return (
    <ComboBox
      ref={setPickerElement}
      className={styles.picker}
      defaultItems={APP_CATALOG}
      defaultInputValue={selectedApp.name}
      value={selectedId}
      onChange={(value) => {
        if (typeof value === 'string') onChange(value)
      }}
      defaultFilter={(text, query) => {
        const app = APP_CATALOG.find((item) => item.name === text)
        return `${text} ${app?.description ?? ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      }}
      allowsEmptyCollection
    >
      {({ isOpen }) => (
        <div
          className={styles.content}
          onKeyDown={(event) => {
            // React Aria closes the picker; Escape must not also close its launcher.
            if (isOpen && event.key === 'Escape') event.stopPropagation()
          }}
        >
          <Label className={styles.label}>Open this app</Label>
          <Group className={styles.field}>
            <AppIcon appId={selectedApp.id} icon={selectedApp.icon} size={24} />
            <Input
              ref={input}
              className={styles.input}
              placeholder="Search apps"
              spellCheck={false}
            />
            <Button className={styles.trigger}>
              <ChevronDown size={16} aria-hidden="true" />
            </Button>
          </Group>
          <Popover
            className={styles.popover}
            UNSTABLE_portalContainer={portalContainer}
            placement="bottom start"
            offset={6}
            maxHeight={272}
            data-launcher-root
          >
            <ListBox<LauncherApp>
              className={styles.results}
              renderEmptyState={() => (
                <p className={styles.empty}>No apps found</p>
              )}
            >
              {(app) => (
                <ListBoxItem
                  id={app.id}
                  textValue={app.name}
                  className={styles.app}
                >
                  {({ isSelected }) => (
                    <>
                      <AppIcon appId={app.id} icon={app.icon} size={24} />
                      <span className={styles.appName}>{app.name}</span>
                      {isSelected && <Check size={16} aria-hidden="true" />}
                    </>
                  )}
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </div>
      )}
    </ComboBox>
  )
}
