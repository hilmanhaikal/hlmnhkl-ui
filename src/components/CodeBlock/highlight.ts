// A small tokenizer for TSX, HTML, CSS and shell: enough to colour short examples. It only splits the
// text; CodeBlock gives each kind its --hl-code-* colour.

export type CodeLanguage = 'tsx' | 'html' | 'css' | 'shell'

export type TokenKind = 'comment' | 'string' | 'tag' | 'attr' | 'keyword' | 'number'

export type Token = { text: string; kind?: TokenKind }

// TSX and HTML share one set: tags, attributes, strings and both comment styles.
const MARKUP = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->)`,
    String.raw`(?<string>'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|` + '`(?:\\\\.|[^`\\\\])*`)',
    String.raw`(?<tag><\/?[A-Za-z][\w.]*|\/?>)`,
    String.raw`(?<attr>\b[A-Za-z][\w-]*(?==))`,
    String.raw`(?<keyword>\b(?:import|from|export|default|const|let|var|function|return|if|else|type|interface|as|async|await|new|true|false|null|undefined|extends|in|of|typeof|void)\b)`,
    String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
  ].join('|'),
  'g',
)

const RULES: Record<CodeLanguage, RegExp> = {
  tsx: MARKUP,
  html: MARKUP,
  css: new RegExp(
    [
      String.raw`(?<comment>\/\*[\s\S]*?\*\/)`,
      String.raw`(?<string>'[^'\n]*'|"[^"\n]*")`,
      String.raw`(?<attr>--[\w-]+)`,
      String.raw`(?<keyword>(?<=^|[\s;{])[a-z-]+(?=\s*:))`,
      String.raw`(?<number>-?\b\d+(?:\.\d+)?(?:px|rem|em|ms|s|%|deg|vh|vw|dvh)?\b|#[0-9a-fA-F]{3,8}\b)`,
    ].join('|'),
    'gm',
  ),
  shell: new RegExp(
    [
      String.raw`(?<comment>#[^\n]*)`,
      String.raw`(?<string>'[^'\n]*'|"[^"\n]*")`,
      String.raw`(?<keyword>^\s*(?:npx|pnpm|yarn|bunx|bun|npm|git|cd)\b)`,
      String.raw`(?<attr>(?<=\s)--?[\w-]+)`,
    ].join('|'),
    'gm',
  ),
}

/** Guesses the language from the text, when the caller does not say. */
export function guessLanguage(code: string): CodeLanguage {
  const first = code.trimStart()
  if (/^(npx|pnpm|yarn|bunx|bun|npm|git|cd)\s/.test(first)) return 'shell'
  if (/^(<!--|<html|<!doctype)/i.test(first)) return 'html'
  if (/^(:root|\[data-|@media|\.[\w-]+\s*\{|--[\w-]+\s*:)/.test(first) || /^[\w-]+\s*:\s*[^;]+;/m.test(first)) return 'css'
  return 'tsx'
}

/** The code as tokens, with plain text between them, in order. */
export function tokenize(code: string, language: CodeLanguage): Token[] {
  const out: Token[] = []
  const re = new RegExp(RULES[language].source, RULES[language].flags)
  let last = 0
  for (let m = re.exec(code); m; m = re.exec(code)) {
    if (m[0] === '') {
      re.lastIndex++
      continue
    }
    const kind = Object.entries(m.groups ?? {}).find(([, v]) => v !== undefined)?.[0] as TokenKind | undefined
    if (m.index > last) out.push({ text: code.slice(last, m.index) })
    out.push({ text: m[0], kind })
    last = m.index + m[0].length
  }
  if (last < code.length) out.push({ text: code.slice(last) })
  return out
}
