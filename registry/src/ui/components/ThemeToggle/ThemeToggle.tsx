// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { bodyAt, createThemeIcon, RAYS, raysAt } from '../../internal/motion/themeIcon'
import { themeReveal } from '../../internal/themeReveal'
import { IconButton } from '../IconButton'
import styles from './ThemeToggle.module.css'

export type ThemeToggleTheme = 'light' | 'dark'

export type ThemeToggleProps = {
  /** The theme, when your app keeps it. Leave it out and the toggle sets data-theme on <html> itself. */
  theme?: ThemeToggleTheme
  /** Called with the new theme on every flip. */
  onThemeChange?: (theme: ThemeToggleTheme) => void
  /** Where the choice is remembered when the toggle runs the page. Match it in themeScript. */
  storageKey?: string
  /** The new theme grows from the button in a circle over the screen. Turn it off for an instant change. */
  reveal?: boolean
  /** The button's size, the same as IconButton. */
  size?: 'sm' | 'md' | 'lg'
  /** Extra class for the button. */
  className?: string
}

export { themeScript } from '../../internal/motion/themeReveal'

const pageTheme = (): ThemeToggleTheme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

// One button that flips between the light and dark theme. The sun morphs into the moon and back.
export function ThemeToggle({ theme: themeProp, onThemeChange, storageKey = 'gooee-theme', reveal = true, size = 'sm', className }: ThemeToggleProps) {
  const controlled = themeProp !== undefined
  const [own, setOwn] = useState<ThemeToggleTheme>('light')
  const theme = controlled ? themeProp : own

  // Read after mount: the server cannot know the page's theme, and themeScript has already set it.
  useEffect(() => {
    if (!controlled) setOwn(pageTheme())
  }, [controlled])

  const next: ThemeToggleTheme = theme === 'dark' ? 'light' : 'dark'
  // Shows the theme the button switches to: the moon in light, the sun in dark (motion/themeIcon.ts).
  const body = useRef<SVGPathElement>(null)
  const icon = useRef<ReturnType<typeof createThemeIcon>>(null)
  icon.current ??= createThemeIcon(() => body.current, theme === 'dark' ? 0 : 1)
  const morphTo = icon.current.morphTo
  // A theme set from outside (or the first paint): morph to it, unless a press already started that morph.
  useLayoutEffect(() => {
    const to = theme === 'dark' ? 0 : 1
    if (icon.current!.aim !== to) morphTo(to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])
  useLayoutEffect(() => () => icon.current!.destroy(), [])
  // The icon answers the press at once; the theme change, and its circle, start two frames later, so
  // the first motion is on screen before the page is held still to be photographed.
  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    const origin = e.currentTarget
    morphTo(next === 'dark' ? 0 : 1)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (reveal) themeReveal(origin, apply)
        else apply()
      }),
    )
  }
  const apply = () => {
    if (!controlled) {
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        // Not saved, so it lasts only this visit; the theme still changes.
      }
      setOwn(next)
    }
    onThemeChange?.(next)
  }

  return (
    <IconButton
      label={`Switch to ${next} theme`}
      variant="secondary"
      size={size}
      className={className}
      onClick={flip}
      icon={
        <svg className={styles.icon} data-slot="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path ref={body} d={bodyAt(icon.current.shown)} />
          <path className={styles.rays} d={RAYS} style={raysAt(icon.current.shown)} />
        </svg>
      }
    />
  )
}
