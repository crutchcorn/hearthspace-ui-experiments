import { useState } from 'react'
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components'
import { Check, ChevronDown } from '../icons'
import styles from './select-control.module.css'

interface SelectOption<Value extends string> {
  id: Value
  label: string
  isDisabled?: boolean
}

interface SelectControlProps<Value extends string> {
  label: string
  options: readonly SelectOption<Value>[]
  value: NoInfer<Value>
  onChange: (value: NoInfer<Value>) => void
  isDisabled?: boolean
}

export default function SelectControl<Value extends string>({
  label,
  options,
  value,
  onChange,
  isDisabled,
}: SelectControlProps<Value>) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const dialog = element?.closest('dialog')
  // The menu must stay inside a modal dialog's top layer and inherit its theme.
  const portalContainer =
    dialog ?? element?.closest('[data-color-mode]') ?? undefined

  return (
    <Select
      ref={setElement}
      className={styles.control}
      value={value}
      onChange={(key) => {
        const option = options.find((item) => item.id === key)
        if (option) onChange(option.id)
      }}
      isDisabled={isDisabled}
    >
      <Label>{label}</Label>
      <Button className={styles.trigger}>
        <SelectValue className={styles.value} />
        <ChevronDown className={styles.chevron} size={16} />
      </Button>
      <Popover
        className={styles.popover}
        UNSTABLE_portalContainer={portalContainer}
        placement="bottom start"
        offset={5}
        containerPadding={8}
        maxHeight={248}
      >
        <ListBox className={styles.options} items={options}>
          {(option) => (
            <ListBoxItem
              id={option.id}
              textValue={option.label}
              isDisabled={option.isDisabled}
              className={styles.option}
            >
              {({ isSelected }) => (
                <>
                  <span>{option.label}</span>
                  {isSelected && <Check size={15} />}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  )
}
