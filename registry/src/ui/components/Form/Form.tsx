// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef } from 'react'
import { createFormErrors, focusFirst, type FormErrors, type ValidationBehavior } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { FormContext } from '../../internal/useField'

export type { FormErrors, ValidationBehavior }

export type FormProps = ComponentPropsWithRef<'form'> & {
  /** Errors by field name, such as a server's answer. Each shows under its field and goes when that field changes, not on a form reset (React resets the form after every action). */
  errors?: FormErrors
  /** "native" uses the browser's checks (required, type, pattern), shows their messages under the fields and blocks a failed submit. "aria" never blocks submit; it only marks fields with errors. */
  validationBehavior?: ValidationBehavior
}

export function Form({ errors, validationBehavior = 'native', noValidate, onSubmit, ref, children, ...rest }: FormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [store] = useState(() => createFormErrors(errors))
  const submitted = useRef(false)

  useLayoutEffect(() => {
    store.set(errors)
    // A submit that came back with errors (a server action, an async check) focuses the first field with one.
    const names = store.names()
    if (submitted.current && names.length && formRef.current) focusFirst(formRef.current, names)
    submitted.current = false
  }, [errors, store])

  return (
    <FormContext value={{ errors: store, validationBehavior }}>
      <form
        {...rest}
        ref={mergeRefs(formRef, ref)}
        data-slot="form"
        noValidate={validationBehavior === 'aria' || noValidate}
        onSubmit={(e) => {
          submitted.current = true
          onSubmit?.(e)
        }}
      >
        {children}
      </form>
    </FormContext>
  )
}
