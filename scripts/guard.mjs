// Runs on every pull request. A pull request may change component code and docs only. It may not
// add packages, install scripts, workflows or scripts, and its new lines are scanned for code a UI
// part never needs (network, storage, eval). A hit is not proof of harm; it means the owner reads it closely.
import { execFileSync } from 'node:child_process'

const base = process.argv[2] || 'origin/main'
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' })
const files = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean)

const allowed = [/^src\/components\/[A-Za-z]+\//, /^src\/internal\//, /^src\/(tokens|base)\.css$/, /^src\/index\.ts$/, /^(README|CHANGELOG|COMPONENTS)\.md$/]
const problems = files.filter((f) => !allowed.some((re) => re.test(f))).map((f) => `${f}: only component code and docs can change in a pull request`)

const risky = [
  [/\beval\s*\(|new\s+Function\s*\(/, 'runs text as code'],
  [/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/, 'talks to the network'],
  [/import\s*\(\s*['"`]https?:/, 'loads code from the web'],
  [/document\.cookie|localStorage|sessionStorage|indexedDB/, 'reads or writes stored data'],
  [/\bprocess\.env\b|child_process|\brequire\s*\(/, 'reaches outside the browser'],
  [/\batob\s*\(|\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){5,}|[A-Za-z0-9+/]{200,}={0,2}/i, 'looks hidden or encoded'],
  [/<script|innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|dangerouslySetInnerHTML|srcdoc/, 'injects markup'],
  [/https?:\/\/|\/\/[a-z0-9-]+\.[a-z]{2,}\//i, 'names an outside address'],
  [/@import|url\(\s*['"]?(https?:|\/\/|data:)/i, 'loads something from CSS'],
  [/(globalThis|window|self|top|parent|document)\s*\[|Reflect\.|\.constructor\s*\(|setTimeout\s*\(\s*['"`]|setInterval\s*\(\s*['"`]/, 'reaches code by a built name'],
  [/postMessage|opener|\.src\s*=|new\s+(Image|Worker|SharedWorker)\b|serviceWorker|importScripts/, 'opens a channel or loads a file'],
]
// Invisible or direction-changing characters can make code read differently from how it runs.
const hidden = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/
for (const f of files.filter((f) => /\.(tsx?|jsx?|css)$/.test(f))) {
  const added = git('diff', '-U0', `${base}...HEAD`, '--', f).split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'))
  for (const line of added) for (const [re, why] of risky) if (re.test(line)) problems.push(`${f}: ${why}: ${line.slice(1).trim().slice(0, 120)}`)
}
for (const f of files) {
  const added = git('diff', '-U0', `${base}...HEAD`, '--', f)
  if (hidden.test(added)) problems.push(`${f}: has invisible or direction-changing characters`)
}
const binary = git('diff', '--numstat', `${base}...HEAD`).split('\n').filter((l) => l.startsWith('-\t-\t'))
for (const l of binary) problems.push(`${l.split('\t')[2]}: binary file`)

if (problems.length) {
  console.error(`The guard found ${problems.length} thing(s) for the owner to check:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`The guard checked ${files.length} changed file(s): nothing risky.`)
