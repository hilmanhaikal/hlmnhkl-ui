// hlmnhkl/ui, MIT licence. https://ui.hlmnhkl.my
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
