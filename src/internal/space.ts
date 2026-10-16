/** A step of the --hl-space-* scale in tokens.css. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export function space(step: Space): string {
  return `var(--hl-space-${step})`
}
