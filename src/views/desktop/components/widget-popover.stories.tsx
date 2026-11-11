import preview from '../../../../.storybook/preview'
import WidgetPopover from './widget-popover'
import { WidgetSample } from '../../../../.storybook/surfaces'
import styles from './widget-popover.module.css'

const meta = preview.meta({
  title: 'Desktop/Frame/Widget Popover',
  component: WidgetPopover,
  args: {
    children: (
      <section
        className={styles.panel}
        aria-label="Sample popup"
        style={
          {
            '--widget-panel-width': '220px',
            padding: 16,
            borderRadius: 'var(--radius-panel)',
            background: 'var(--material-raised)',
          } as import('react').CSSProperties
        }
      >
        <button type="button">Open Overview</button>
      </section>
    ),
  },
  render: (args) => (
    <WidgetSample id="tools">
      <button type="button" aria-expanded="true">
        Canvas tools
      </button>
      <WidgetPopover {...args} />
    </WidgetSample>
  ),
})

export const Anchored = meta.story({})
