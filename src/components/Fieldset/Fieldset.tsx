'use client'

import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import styles from './Fieldset.module.css'

export type FieldsetProps = Omit<ComponentPropsWithRef<'fieldset'>, 'children'> & {
  /** Visible name of the group, rendered as the legend. */
  legend: ReactNode
  /** Muted text under the legend, read with the group. */
  description?: ReactNode
  /** Error for the group as a whole, shown under the fields and read with the group. */
  error?: ReactNode
  /** Turns off every field inside, natively, so none of them can be focused or sent. */
  disabled?: boolean
  /** The fields. */
  children: ReactNode
}

export function Fieldset({ legend, description, error, disabled, className, children, id, 'aria-describedby': describedByProp, ...rest }: FieldsetProps) {
  const auto = useId()
  const base = id ?? auto
  const descId = `${base}-desc`
  const errorId = `${base}-error`
  const describedBy = [description ? descId : null, error ? errorId : null, describedByProp].filter(Boolean).join(' ')
  return (
    <fieldset
      {...rest}
      id={id}
      className={cx(styles.root, className)}
      disabled={disabled}
      aria-describedby={describedBy || undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      {description && <p id={descId} className={styles.description}>{description}</p>}
      <div className={styles.fields}>{children}</div>
      <FieldMessage helpId={`${base}-help`} errorId={errorId} error={error} />
    </fieldset>
  )
}
