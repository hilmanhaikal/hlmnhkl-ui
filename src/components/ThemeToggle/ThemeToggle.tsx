'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '../../internal/icons'
import { IconButton } from '../IconButton'
import styles from './ThemeToggle.module.css'

export type Theme = 'light' | 'dark'

export type ThemeToggleProps = {
  /** The theme, when your app keeps it. Leave it out and the toggle sets data-theme on <html> itself. */
  theme?: Theme
  /** Called with the new theme on every flip. */
  onThemeChange?: (theme: Theme) => void
  /** Where the choice is remembered when the toggle runs the page. Match it in themeScript. */
  storageKey?: string
  /** The button's size, the same as IconButton. */
  size?: 'sm' | 'md' | 'lg'
  /** Extra class for the button. */
  className?: string
}

/** Put in <head>, before the page paints, so a saved dark theme never flashes light first. */
export const themeScript = (storageKey = 'hl-theme') =>
  `try{var t=localStorage.getItem(${JSON.stringify(storageKey)});if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`

const pageTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

// One button that flips between the light and dark theme. The sun turns into the moon and back.
export function ThemeToggle({ theme: themeProp, onThemeChange, storageKey = 'hl-theme', size = 'sm', className }: ThemeToggleProps) {
  const controlled = themeProp !== undefined
  const [own, setOwn] = useState<Theme>('light')
  const theme = controlled ? themeProp : own

  // Read after mount: the server cannot know the page's theme, and themeScript has already set it.
  useEffect(() => {
    if (!controlled) setOwn(pageTheme())
  }, [controlled])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const flip = () => {
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
        <span className={styles.icon} data-theme-shown={theme}>
          <SunIcon className={styles.sun} />
          <MoonIcon className={styles.moon} />
        </span>
      }
    />
  )
}
