// Gooee UI, MIT licence. https://gooee.dev
'use client'

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createTabsRise, measureTab, revealTab, setTabStop, tabKey } from '../../internal/motion/tabs'
import { cx } from '../../internal/cx'
import { useControllable } from '../../internal/useControllable'
import styles from './Tabs.module.css'

type Ctx = { value: string; set: (v: string) => void; baseId: string }
const TabsCtx = createContext<Ctx | null>(null)
const useTabs = () => {
  const c = useContext(TabsCtx)
  if (!c) throw new Error('Tabs parts must be inside <Tabs>')
  return c
}
// Odd characters become codes like "_20_", so values never share an id
const safe = (v: string) => v.replace(/[^a-zA-Z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}_`)

export type TabsProps = {
  /** Selected tab value, when you control it. */
  value?: string
  /** Starting tab value when you do not control it. Also needed when you do. */
  defaultValue: string
  /** Called when the selected tab changes, with the new tab value. */
  onValueChange?: (value: string) => void
  /** Extra class for the root element. */
  className?: string
  /** A TabList and its TabPanel elements. */
  children: ReactNode
}

export function Tabs({ value: valueProp, defaultValue, onValueChange, className, children }: TabsProps) {
  const baseId = useId()
  const [value, set] = useControllable(valueProp, defaultValue, onValueChange)
  return (
    <TabsCtx.Provider value={{ value, set, baseId }}>
      <div className={cx(styles.root, className)} data-gooee-tabs="">
        {children}
      </div>
    </TabsCtx.Provider>
  )
}

export type TabListProps = {
  /** Screen reader name for the row of tabs. */
  label: string
  /** Extra class for the root element. */
  className?: string
  /** The Tab elements. */
  children: ReactNode
}

export function TabList({ label, className, children }: TabListProps) {
  const { value } = useTabs()
  const listRef = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<{ x: number; w: number; room: number; value: string } | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const next = measureTab(list, value)
      if (next) setBar(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [value])

  useLayoutEffect(() => setTabStop(listRef.current))

  // The rise stretches over to a new choice (motion/tabs.ts).
  const riseRef = useRef<HTMLSpanElement>(null)
  const rise = useRef<ReturnType<typeof createTabsRise>>(null)
  rise.current ??= createTabsRise()
  useLayoutEffect(() => rise.current?.place(riseRef.current, bar), [bar])
  useLayoutEffect(() => () => rise.current?.destroy(), [])

  const onKeyDown = (e: KeyboardEvent) => tabKey(listRef.current, e)

  return (
    <div className={cx(styles.listScroll, className)}>
      <div ref={listRef} role="tablist" aria-label={label} className={styles.list} onKeyDown={onKeyDown}>
        {children}
        {bar && (
          <span ref={riseRef} className={styles.rise} aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

export type TabProps = {
  /** Picks this tab. Must match the value of its TabPanel. */
  value: string
  /** Stops the tab from being picked. Arrow keys skip it. */
  disabled?: boolean
  /** Text on the tab. */
  children: ReactNode
}

export function Tab({ value, disabled, children }: TabProps) {
  const ctx = useTabs()
  const on = ctx.value === value
  const id = `${ctx.baseId}-tab-${safe(value)}`
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={on}
      aria-controls={`${ctx.baseId}-panel-${safe(value)}`}
      tabIndex={on ? 0 : -1}
      disabled={disabled}
      className={styles.tab}
      onClick={() => {
        ctx.set(value)
        revealTab(id)
      }}
    >
      {children}
    </button>
  )
}

export type TabPanelProps = {
  /** Shows this panel when the Tab with the same value is selected. */
  value: string
  /** Extra class for the panel. */
  className?: string
  /** Content of the panel. It mounts only while the panel shows. */
  children: ReactNode
}

export function TabPanel({ value, className, children }: TabPanelProps) {
  const ctx = useTabs()
  const on = ctx.value === value
  return (
    <div
      id={`${ctx.baseId}-panel-${safe(value)}`}
      role="tabpanel"
      aria-labelledby={`${ctx.baseId}-tab-${safe(value)}`}
      hidden={!on}
      tabIndex={0}
      className={cx(styles.panel, className)}
    >
      {on && children}
    </div>
  )
}
