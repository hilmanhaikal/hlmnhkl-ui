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
import { useLiquid } from '../../internal/liquid'
import { useBead } from '../../internal/liquidMore'
import { mergeRefs } from '../../internal/mergeRefs'
import { createMenuKeys, itemKey, menuButtonKey, menuItems } from '../../internal/motion/menuKeys'
import { Portal } from '../../internal/Portal'
import { useFloating, type Align } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import styles from './DropdownMenu.module.css'

export type DropdownMenuEntry =
  | {
      type?: 'item'
      label: string
      icon?: ReactNode
      shortcut?: string
      onSelect?: () => void
      disabled?: boolean
      /** Why the item is disabled. Shown as small text under the label while it is disabled. */
      disabledReason?: string
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
  items: DropdownMenuEntry[]
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
  const { mounted, state } = usePresence(open, 'morph-out')
  const floating = useFloating(anchorRef, menuRef, { open: mounted, side: 'bottom', align, offset: 6 })
  // The menu grows out of its button and folds back into it.
  useLiquid(menuRef, anchorRef, state, mounted && floating.ready)
  // The hover fill is a bead that follows the pointer from item to item.
  useBead(menuRef, mounted, styles.bead)

  const close = (focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) anchorRef.current?.focus()
  }
  useDismiss(open, [anchorRef, menuRef], (reason) => close(reason === 'escape'))

  useEffect(() => {
    if (!open) return
    const list = menuItems(menuRef.current)
    ;(focusAt === 'first' ? list[0] : list[list.length - 1])?.focus({ preventScroll: true })
  }, [open, focusAt])

  const openMenu = (at: 'first' | 'last') => {
    setFocusAt(at)
    setOpen(true)
  }

  // Arrows, Home, End, type-ahead and Tab (motion/menuKeys.ts).
  const closeRef = useRef(close)
  closeRef.current = close
  const keys = useRef<ReturnType<typeof createMenuKeys>>(null)
  keys.current ??= createMenuKeys(() => menuRef.current, () => closeRef.current())

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
          const at = menuButtonKey(e)
          if (at) openMenu(at)
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
            data-slot="dropdown-menu-content"
            className={styles.menu}
            data-state={state}
            data-side={floating.side}
            style={floating.style}
            onKeyDown={keys.current}
          >
            {items.map((item, i) => {
              if (item.type === 'separator') return <div key={i} role="separator" data-slot="dropdown-menu-separator" className={styles.separator} />
              if (item.type === 'label')
                return (
                  <div key={i} role="presentation" data-slot="dropdown-menu-label" className={styles.groupLabel}>
                    {item.label}
                  </div>
                )
              const n = stagger++
              const reason = item.disabled ? item.disabledReason : undefined
              return (
                <div
                  key={i}
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  data-slot="dropdown-menu-item"
                  className={styles.item}
                  data-disabled={item.disabled || undefined}
                  data-destructive={item.destructive || undefined}
                  style={{ ['--i' as string]: n }}
                  onPointerMove={(e) => !item.disabled && e.currentTarget.focus()}
                  onClick={() => {
                    if (item.disabled) return
                    close()
                    item.onSelect?.()
                  }}
                  onKeyDown={itemKey}
                >
                  {item.icon && <span data-slot="dropdown-menu-item-icon" className={styles.icon}>{item.icon}</span>}
                  <span data-slot="dropdown-menu-item-label" className={styles.label}>
                    {item.label}
                    {reason && (
                      <span data-slot="dropdown-menu-item-reason" className={styles.reason}>
                        {reason}
                      </span>
                    )}
                  </span>
                  {item.shortcut && <kbd data-slot="dropdown-menu-shortcut" className={styles.shortcut}>{item.shortcut}</kbd>}
                </div>
              )
            })}
          </div>
        </Portal>
      )}
    </>
  )
}
