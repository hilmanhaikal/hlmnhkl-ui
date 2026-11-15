// Gooee UI, MIT licence. https://gooee.dev
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
