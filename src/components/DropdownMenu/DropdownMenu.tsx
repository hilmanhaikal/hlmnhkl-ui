'use client'

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { useDismiss } from '../../internal/layers'
import { mergeRefs } from '../../internal/mergeRefs'
import { Portal } from '../../internal/Portal'
import { useFloating, type Align } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import styles from './DropdownMenu.module.css'

export type MenuEntry =
  | {
      type?: 'item'
      label: string
      icon?: ReactNode
      shortcut?: string
      onSelect?: () => void
      disabled?: boolean
      /** Marks a destructive action in red and bold. Use a clear word too, such as "Delete". */
      destructive?: boolean
    }
  | { type: 'separator' }
  | { type: 'label'; label: string }

type TriggerProps = {
  id?: string
  ref?: Ref<HTMLElement>
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

export type DropdownMenuProps = {
  /** One button that opens the menu. It gets the menu ARIA attributes, and an id if it has none. */
  trigger: ReactElement<TriggerProps>
  /** Items, separators and group labels, in menu order. */
  items: MenuEntry[]
  /** Accessible name for the menu, if the trigger text is not enough. */
  label?: string
  /** Which edge of the trigger the menu lines up with. */
  align?: Align
}

export function DropdownMenu({ trigger, items, label, align = 'start' }: DropdownMenuProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [focusAt, setFocusAt] = useState<'first' | 'last'>('first')
  const anchorRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const typeahead = useRef({ text: '', at: 0 })
  const { mounted, state } = usePresence(open, 'fast')
  const floating = useFloating(anchorRef, menuRef, { open: mounted, side: 'bottom', align, offset: 6 })

  const close = (focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) anchorRef.current?.focus()
  }
  useDismiss(open, [anchorRef, menuRef], (reason) => close(reason === 'escape'))

  const menuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])

  useEffect(() => {
    if (!open) return
    const list = menuItems()
    ;(focusAt === 'first' ? list[0] : list[list.length - 1])?.focus({ preventScroll: true })
  }, [open, focusAt])

  const openMenu = (at: 'first' | 'last') => {
    setFocusAt(at)
    setOpen(true)
  }

  const onMenuKey = (e: KeyboardEvent) => {
    const list = menuItems()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      list[(n + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    // The menu is portalled, so focus goes back to the trigger and Tab carries on from there.
    else if (e.key === 'Tab') close()
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now()
      const t = typeahead.current
      t.text = now - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase()
      t.at = now
      for (let n = 1; n <= list.length; n++) {
        const el = list[(i + n) % list.length]
        if (el.textContent?.trim().toLowerCase().startsWith(t.text)) {
          el.focus()
          break
        }
      }
    }
  }

  if (!isValidElement(trigger)) return null
  const tp = trigger.props
  // A caller's id on the trigger wins, so their own labels and tests keep working.
  const triggerId = tp.id ?? `${id}-trigger`
  let stagger = 0

  return (
    <>
      {cloneElement(trigger, {
        ref: mergeRefs(anchorRef, tp.ref),
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: (e: MouseEvent<HTMLElement>) => {
          tp.onClick?.(e)
          if (open) close()
          else openMenu('first')
        },
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          tp.onKeyDown?.(e)
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            openMenu('first')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            openMenu('last')
          }
        },
      } as TriggerProps)}
      {mounted && (
        <Portal>
          <div
            ref={menuRef}
            id={id}
            role="menu"
            aria-label={label}
            aria-labelledby={label ? undefined : triggerId}
            className={styles.menu}
            data-state={state}
            data-side={floating.side}
            style={floating.style}
            onKeyDown={onMenuKey}
          >
            {items.map((item, i) => {
              if (item.type === 'separator') return <div key={i} role="separator" className={styles.separator} />
              if (item.type === 'label')
                return (
                  <div key={i} role="presentation" className={styles.groupLabel}>
                    {item.label}
                  </div>
                )
              const n = stagger++
              return (
                <div
                  key={i}
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  className={styles.item}
                  data-destructive={item.destructive || undefined}
                  style={{ ['--i' as string]: n }}
                  onPointerMove={(e) => !item.disabled && e.currentTarget.focus()}
                  onClick={() => {
                    if (item.disabled) return
                    close()
                    item.onSelect?.()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.currentTarget.click()
                    }
                  }}
                >
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  <span className={styles.label}>{item.label}</span>
                  {item.shortcut && <kbd className={styles.shortcut}>{item.shortcut}</kbd>}
                </div>
              )
            })}
          </div>
        </Portal>
      )}
    </>
  )
}
