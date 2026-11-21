#!/usr/bin/env node
// The Gooee UI command line: sets a project up, lists what exists, and copies components, blocks,
// templates and themes (with everything they import) into it, then shows and takes later changes.
// Runs as `npx gooee <command>` from the npm package, or `npm run add -- <command>` in this repo.
// Plain JavaScript on purpose: the project has no Node type package.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const INTERNAL = join(SRC, 'internal')
// Shared folders: what a part imports from them comes along, into the same folder name in the app.
// src/icons is public (names and props stay within a major version); src/internal may change.
const ICONS = join(SRC, 'icons')
const SHARED = [INTERNAL, ICONS]
const inShared = (file) => SHARED.some((dir) => file.startsWith(dir + sep))
const EXCLUDED = /(\.(test|spec|stories|demo)\.[jt]sx?$)|(^|\/)(docs|demos|__tests__)\//
const DEFAULT_TO = 'src/ui'
const CONFIG = 'gooee.json'
const SITE = 'https://gooee.dev'
const COMMANDS = ['init', 'add', 'list', 'diff', 'update']
const USAGE = `Usage: npx gooee <command> [options]

  init                     Set a project up: tokens.css, base.css and ${CONFIG}
  add <name> [<name>...]   Copy components, blocks, templates or themes, with what they import
  list [--kind <kind>]     Show everything there is (kind: components, blocks, templates, themes)
  diff <name> [<name>...]  Show what changed between your copy and the latest version
  update <name> [...]      Show the changes, then replace your copy after you say yes

Options:
  --to <folder>   Where files go. Defaults to the folder in ${CONFIG}, else ${DEFAULT_TO}
  --overwrite     add: replace files that are already there
  --with-base     add: also copy base.css (init always does)
  --yes           update: replace without asking, and update the parts that share a changed file
  --vue           Vue parts (.vue). init saves it in ${CONFIG}, so later commands use it too
  --react         React parts (.tsx), the default. Wins over the framework in ${CONFIG}
  --dry-run       Show what would happen, write nothing

In this repo, run: npm run add -- <command> ...`

// A theme is one CSS file; every other kind is a folder per name. Each kind keeps its folder name in the target.
const KINDS = [
  { key: 'component', plural: 'Components', folder: 'components', pro: false },
  { key: 'block', plural: 'Blocks', folder: 'blocks', pro: true },
  { key: 'template', plural: 'Templates', folder: 'templates', pro: true },
  { key: 'theme', plural: 'Themes', folder: 'themes', pro: true, single: true },
].map((k) => ({ ...k, dir: join(SRC, k.folder) }))

// The import lines as they read from the app's entry file. A folder inside src/ is written
// relative to src/ (Vite, Next and most setups keep the entry there), so it can be pasted as is.
function fromEntry(folder, both = true) {
  const clean = folder.replace(/^\.\//, '').replace(/\/$/, '')
  const inSrc = clean.startsWith('src/')
  const rel = inSrc ? clean.slice(4) : clean
  const where = inSrc ? `in your entry file inside src/ (for example src/main.${framework === 'vue' ? 'ts' : 'tsx'}):` : 'in a file at your project root:'
  const lines = [`import './${rel}/tokens.css'`, ...(both ? [`import './${rel}/base.css'`] : [])]
  return `${where}\n${lines.map((l) => `       ${l}`).join('\n')}`
}

function fail(message, usage = true) {
  console.error(`Error: ${message}`)
  if (usage) console.error(`\n${USAGE}`)
  process.exit(1)
}

function parseArgs(argv) {
  const opts = { command: '', names: [], to: '', kind: '', overwrite: false, dryRun: false, withBase: false, yes: false, framework: '' }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h' || arg === 'help') {
      console.log(USAGE)
      console.log('\nA name can be a component (Button), a block (Dashboard), a template or a theme (forest).')
      console.log(`A name can also be a shared helper, to build your own parts on it: ${Object.keys(HELPERS).join(', ')}.`)
      console.log('When two kinds share a name, add the kind: blocks/Settings, templates/Settings.')
      process.exit(0)
    } else if (arg === '--to' || arg === '--kind') {
      const value = argv[++i] ?? ''
      if (!value || value.startsWith('--')) fail(arg === '--to' ? '--to needs a folder, for example --to src/ui' : '--kind needs a kind, for example --kind blocks')
      opts[arg.slice(2)] = value
    } else if (arg.startsWith('--to=')) opts.to = arg.slice(5)
    else if (arg.startsWith('--kind=')) opts.kind = arg.slice(7)
    else if (arg === '--overwrite') opts.overwrite = true
    else if (arg === '--dry-run') opts.dryRun = true
    else if (arg === '--with-base') opts.withBase = true
    else if (arg === '--vue' || arg === '--react') {
      if (opts.framework && opts.framework !== arg.slice(2)) fail('Use --vue or --react, not both.')
      opts.framework = arg.slice(2)
    }
    else if (arg === '--yes' || arg === '-y') opts.yes = true
    else if (arg.startsWith('-')) fail(`Unknown option ${arg}.`)
    else rest.push(arg)
  }
  // The command always comes first, so a new command can never clash with a part's name.
  if (!rest.length) fail('Name a command.')
  const first = rest.shift()
  if (!COMMANDS.includes(first)) {
    const near = COMMANDS.find((c) => distance(first.toLowerCase(), c) <= 1)
    fail(`"${first}" is not a command. ${near ? `Did you mean npx gooee ${near}?` : `To add it, run: npx gooee add ${[first, ...rest].join(' ')}`}`, false)
  }
  opts.command = first
  opts.names = rest
  if (['add', 'diff', 'update'].includes(opts.command) && !opts.names.length) {
    fail(`Name at least one component, block, template or theme, for example: npx gooee ${opts.command} button`)
  }
  return opts
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = row[j]
      row[j] = next
    }
  }
  return row[b.length]
}

function suggest(name, all) {
  const low = name.toLowerCase()
  return all
    .map((item) => {
      const l = item.name.toLowerCase()
      const score = l === low ? -1 : l.includes(low) || low.includes(l) ? 0 : distance(low, l)
      return { item, score }
    })
    .filter((s) => s.score <= Math.max(2, Math.floor(name.length / 3)))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((s) => label(s.item))
}

const isDir = (p) => existsSync(p) && statSync(p).isDirectory()
const isFile = (p) => existsSync(p) && statSync(p).isFile()
const rel = (p) => relative(SRC, p).split(sep).join('/')
const kindOf = (key) => KINDS.find((k) => k.key === key)
const keyOf = (item) => `${item.kind}:${item.name}`
const label = (item) => (item.kind === 'component' ? item.name : `${item.name} (${item.kind})`)
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// Shared helpers an app can add on its own, to build its own parts the way the library builds them.
// Each is a file in src/internal; what it imports from src/internal comes with it.
const HELPERS = { 'scroll-frame': 'scrollFrame.ts' }

// Every name that can be copied, in every kind.
function listItems() {
  return KINDS.flatMap((k) => {
    if (!isDir(k.dir)) return []
    return readdirSync(k.dir, { withFileTypes: true })
      .filter((d) => (k.single ? d.isFile() && d.name.endsWith('.css') : d.isDirectory()))
      .map((d) => ({ kind: k.key, name: k.single ? d.name.slice(0, -4) : d.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })
}

// "dashboard" finds the Dashboard block and "date-picker" finds DatePicker. "blocks/Settings" picks one kind when two share a name.
function lookup(raw, all) {
  const slash = raw.indexOf('/')
  const prefix = slash > 0 ? raw.slice(0, slash).toLowerCase() : ''
  const name = (slash > 0 ? raw.slice(slash + 1) : raw).replace(/[-_]/g, '')
  const kind = prefix ? KINDS.find((k) => k.folder === prefix || k.key === prefix) : undefined
  if (prefix && !kind) fail(`"${prefix}" is not a kind. Use components/, blocks/, templates/ or themes/.`)
  const pool = kind ? all.filter((i) => i.kind === kind.key) : all
  const hits = pool.filter((i) => i.name.toLowerCase() === name.toLowerCase())
  if (hits.length === 1) return hits[0]
  if (hits.length > 1) {
    fail(`"${raw}" is more than one thing: ${hits.map(label).join(', ')}. Add the kind, for example ${kindOf(hits[1].kind).folder}/${hits[1].name}.`)
  }
  const helper = Object.keys(HELPERS).find((h) => h.replace(/-/g, '') === name.toLowerCase())
  if (helper && !prefix) return { kind: 'helper', name: helper, file: join(INTERNAL, HELPERS[helper]) }
  const pro = proComponents().find((p) => p.toLowerCase() === name.toLowerCase())
  if (pro) fail(`${pro} is in Gooee UI Pro, so it is not in this package. See ${SITE}/${raw.toLowerCase()}`, false)
  const close = suggest(name, all)
  fail(`There is no component, block, template or theme called "${raw}".${close.length ? ` Did you mean ${close.join(', ')}?` : ''}`, false)
}

// Only in the public package: the names of Pro components, so asking for one gets a clear answer.
function proComponents() {
  const file = join(ROOT, 'scripts', 'pro-components.json')
  return isFile(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
}

// Only in this repo: the Pro component ids from src/docs/tiers.ts, so a Pro file gets the Pro credit line.
let proIds
function isPro(item) {
  if (kindOf(item.kind).pro) return true
  if (proIds === undefined) {
    const tiers = join(SRC, 'docs', 'tiers.ts')
    const src = isFile(tiers) ? readFileSync(tiers, 'utf8') : ''
    const set = src.match(/proComponentIds = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
    proIds = new Set([...set.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]))
  }
  return proIds.has(kebab(item.name))
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (EXCLUDED.test(rel(p) + (d.isDirectory() ? '/' : ''))) return []
    return d.isDirectory() ? listFiles(p) : [p]
  })
}

// React or Vue: --react or --vue, else the framework in gooee.json, else React.
// A part folder holds both: Switch.tsx and Switch.vue share Switch.module.css.
let framework = 'react'
const forFramework = (file) => (file.endsWith('.vue') ? framework === 'vue' : framework === 'react' || file.endsWith('.css'))

const hasVue = (item) => kindOf(item.kind).single || listFiles(join(kindOf(item.kind).dir, item.name)).some((f) => f.endsWith('.vue'))

const filesOf = (item) => {
  const k = kindOf(item.kind)
  if (k.single) return [join(k.dir, `${item.name}.css`)]
  const files = listFiles(join(k.dir, item.name))
  if (framework === 'vue' && !files.some((f) => f.endsWith('.vue'))) {
    const withVue = KINDS.filter((x) => !x.single)
      .flatMap((x) => (existsSync(x.dir) ? readdirSync(x.dir).filter((d) => existsSync(join(x.dir, d, `${d}.vue`))) : []))
      .map(kebab)
    fail(`${item.name} has no Vue version yet. These do: ${withVue.join(', ') || 'none'}.`, false)
  }
  const kept = files.filter(forFramework)
  // A Vue part also needs the plain .ts helpers in its own folder that it imports (Tabs reads tabsContext.ts).
  if (framework === 'vue')
    for (let i = 0; i < kept.length; i++)
      for (const spec of importsOf(kept[i])) {
        const target = files.find((f) => resolve(f) === resolveImport(kept[i], spec))
        if (target && !kept.includes(target)) kept.push(target)
      }
  return kept
}

function importsOf(file) {
  if (!/\.(ts|tsx|vue)$/.test(file)) return []
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const found = []
  const re = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g
  for (let m; (m = re.exec(code)); ) if (m[1].startsWith('.')) found.push(m[1])
  return found
}

function resolveImport(from, spec) {
  const base = resolve(dirname(from), spec)
  const tries = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
  const hit = tries.find(isFile)
  if (!hit) fail(`${rel(from)} imports "${spec}", but no such file exists.`, false)
  return hit
}

// Which component, block, template or theme a file belongs to, or null for src/internal and src/icons.
function ownerOf(file) {
  if (inShared(file)) return null
  for (const k of KINDS) {
    if (!file.startsWith(k.dir + sep)) continue
    if (k.single) return { kind: k.key, name: basename(file, '.css') }
    return { kind: k.key, name: relative(k.dir, file).split(sep)[0] }
  }
  fail(`${rel(file)} is outside src/components, src/blocks, src/templates, src/themes, src/internal and src/icons, so it cannot be copied.`, false)
}

function plan(items) {
  const queue = [...items]
  const picked = new Map()
  const internal = new Set()
  const needs = new Map()
  const seenInternal = []
  const visitInternal = (file) => {
    if (internal.has(file)) return
    internal.add(file)
    seenInternal.push(file)
  }
  while (queue.length) {
    const item = queue.shift()
    // A helper is one internal file: it travels with the internal files, not as an item.
    if (item.kind === 'helper') {
      visitInternal(item.file)
      continue
    }
    const key = keyOf(item)
    if (picked.has(key)) continue
    picked.set(key, item)
    for (const file of filesOf(item)) {
      for (const spec of importsOf(file)) {
        const target = resolveImport(file, spec)
        const owner = ownerOf(target)
        if (owner === null) visitInternal(target)
        else if (keyOf(owner) !== key) {
          if (!needs.has(key)) needs.set(key, { item, deps: new Map() })
          needs.get(key).deps.set(keyOf(owner), owner)
          queue.push(owner)
        }
      }
    }
  }
  for (let i = 0; i < seenInternal.length; i++) {
    for (const spec of importsOf(seenInternal[i])) {
      const target = resolveImport(seenInternal[i], spec)
      if (ownerOf(target) !== null) fail(`${rel(seenInternal[i])} imports from outside src/internal and src/icons, which shared files must not do.`, false)
      visitInternal(target)
    }
  }
  return { items: [...picked.values()], internal: [...internal].sort(), needs }
}

// Every copied file starts with one credit line, so the MIT licence's notice travels with the code.
// It is left out when comparing, so it never counts as a change.
function credit(file, pro) {
  const text = pro ? `Gooee UI Pro, see LICENSE-PRO.md. ${SITE}` : `Gooee UI, MIT licence. ${SITE}`
  return file.endsWith('.css') ? `/* ${text} */\n` : file.endsWith('.vue') ? `<!-- ${text} -->\n` : `// ${text}\n`
}
// Copies made before the rename start with the old name, hlmnhkl/ui, so diff and update still see them as ours.
const withoutCredit = (text) => text.replace(/^(\/\/ (?:Gooee UI|hlmnhkl\/ui)[^\n]*|\/\* (?:Gooee UI|hlmnhkl\/ui)[^\n]*\*\/|<!-- Gooee UI[^\n]*-->)\n/, '')

// The project folder (npm runs scripts from the repo root; INIT_CWD is where the command was typed).
const CWD = process.env.INIT_CWD ?? process.cwd()

function readConfig() {
  const file = join(CWD, CONFIG)
  if (!isFile(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    fail(`${CONFIG} is not valid JSON. Fix it or delete it, then run the command again.`, false)
  }
}

// gooee.json keeps a short hash of each file the CLI wrote, so update can tell whether a file the
// latest version dropped is still exactly as written, and only then delete it.
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)
const configKey = (file) => relative(CWD, file).split(sep).join('/')

function saveHashes(written, dropped = []) {
  const config = readConfig()
  if (!config) return
  const files = { ...config.files }
  for (const c of written) files[configKey(c.to)] = hash(readFileSync(c.from, 'utf8'))
  for (const f of dropped) delete files[configKey(f)]
  config.files = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(join(CWD, CONFIG), `${JSON.stringify(config, null, 2)}\n`)
}

function targetFolder(opts) {
  const folder = opts.to || readConfig()?.to || DEFAULT_TO
  const to = resolve(CWD, folder)
  if (existsSync(to) && !isDir(to)) fail(`--to points at a file, not a folder: ${folder}`, false)
  return { folder, to }
}

// Every file a set of items needs, with where it goes and which credit it gets.
function copiesFor(items, internal, to) {
  const copies = []
  for (const item of items) {
    const k = kindOf(item.kind)
    const pro = isPro(item)
    for (const file of filesOf(item)) copies.push({ from: file, to: join(to, k.folder, relative(k.dir, file)), pro })
  }
  for (const file of internal) copies.push({ from: file, to: join(to, relative(SRC, file)), pro: false })
  return copies
}

const fresh = (c) => credit(c.to, c.pro) + readFileSync(c.from, 'utf8')
const state = (c) => (!existsSync(c.to) ? 'missing' : withoutCredit(readFileSync(c.to, 'utf8')) === readFileSync(c.from, 'utf8') ? 'same' : 'changed')

function writeCopy(c, dryRun) {
  if (dryRun) return
  mkdirSync(dirname(c.to), { recursive: true })
  writeFileSync(c.to, fresh(c))
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const shown = (to, file) => relative(to, file).split(sep).join('/')

// The smallest set of changed lines, with two lines around each, like `git diff`.
function lineDiff(oldText, newText) {
  const a = oldText.split('\n')
  const b = newText.split('\n')
  const n = a.length
  const m = b.length
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  const ops = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push([' ', a[i++], j++])
    else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) ops.push(['+', b[j++]])
    else ops.push(['-', a[i++]])
  }
  const keep = ops.map((op, k) => op[0] !== ' ' || ops.slice(Math.max(0, k - 2), k + 3).some((o) => o[0] !== ' '))
  const out = []
  ops.forEach((op, k) => {
    if (keep[k]) out.push(`${op[0]} ${op[1]}`)
    else if (keep[k - 1]) out.push('  ...')
  })
  return out
}

// --- Commands -------------------------------------------------------------------------------------

function runInit(opts) {
  const { folder, to } = targetFolder(opts)
  const sheets = ['tokens.css', 'base.css'].map((name) => ({ from: join(SRC, name), to: join(to, name), pro: false }))
  console.log(`${opts.dryRun ? 'Dry run, nothing written. ' : ''}Setting up Gooee UI in ${folder}`)
  for (const s of sheets) {
    if (existsSync(s.to)) console.log(`  ${basename(s.to)}: already there, kept (your theme edits stay)`)
    else {
      writeCopy(s, opts.dryRun)
      console.log(`  ${basename(s.to)}: added`)
    }
  }
  const config = join(CWD, CONFIG)
  if (isFile(config)) console.log(`  ${CONFIG}: already there, kept`)
  else {
    if (!opts.dryRun) writeFileSync(config, `${JSON.stringify({ framework, to: folder }, null, 2)}\n`)
    console.log(`  ${CONFIG}: added, so later commands use ${framework === 'vue' ? 'Vue' : 'React'} and put files in ${folder}`)
  }
  console.log(`\nNext:\n  1. Import both once, tokens first, ${fromEntry(folder)}`)
  console.log('  2. Add your first component: npx gooee add button')
  console.log(`  See everything there is: npx gooee list, or ${SITE}`)
}

function runList(opts) {
  const all = listItems()
  const wanted = opts.kind ? KINDS.find((k) => k.folder === opts.kind.toLowerCase() || k.key === opts.kind.toLowerCase()) : null
  if (opts.kind && !wanted) fail(`"${opts.kind}" is not a kind. Use components, blocks, templates or themes.`)
  const vue = framework === 'vue'
  if (vue) console.log('Vue parts. Add --react to see the React ones.')
  for (const k of KINDS) {
    if (wanted && wanted !== k) continue
    const names = all.filter((i) => i.kind === k.key)
    const fits = vue ? names.filter(hasVue) : names
    const free = fits.filter((i) => !isPro(i)).map((i) => i.name)
    const pro = [...fits.filter((i) => isPro(i)).map((i) => i.name), ...(k.key === 'component' ? proComponents() : [])]
    const reactOnly = names.filter((i) => !fits.includes(i)).map((i) => i.name)
    if (!free.length && !pro.length && !reactOnly.length) continue
    console.log(`${k.plural} (${free.length + pro.length})`)
    if (free.length) console.log(`  ${free.join(', ')}`)
    if (pro.length) console.log(`  Pro: ${pro.join(', ')}`)
    if (reactOnly.length) console.log(`  React only: ${reactOnly.join(', ')}`)
  }
  if (!wanted && !vue) console.log(`Helpers (${Object.keys(HELPERS).length})\n  ${Object.keys(HELPERS).join(', ')}`)
  console.log(`\nAdd one: npx gooee add <name>. Every page: ${SITE}`)
}

function runAdd(opts) {
  const all = listItems()
  const { to } = targetFolder(opts)
  const { items, internal, needs } = plan(opts.names.map((n) => lookup(n, all)))
  const copies = copiesFor(items, internal, to)
  const sheets = [{ from: join(SRC, 'tokens.css'), to: join(to, 'tokens.css'), pro: false }]
  if (opts.withBase) sheets.push({ from: join(SRC, 'base.css'), to: join(to, 'base.css'), pro: false })

  const written = []
  const skipped = []
  const put = (c, allowOverwrite) => {
    const s = state(c)
    if (s !== 'missing' && !allowOverwrite) {
      skipped.push(`${shown(to, c.to)} (already there, ${s === 'same' ? 'same' : 'different'})`)
      return false
    }
    writeCopy(c, opts.dryRun)
    written.push(shown(to, c.to))
    return true
  }
  for (const c of copies) put(c, opts.overwrite)
  if (!opts.dryRun) saveHashes(copies.filter((c) => state(c) === 'same'))
  // Stylesheets hold the app's own theme edits, so they are never replaced.
  const tokensNew = put(sheets[0], false)
  if (sheets[1]) put(sheets[1], false)

  console.log(`${opts.dryRun ? 'Dry run, nothing written. ' : ''}Target: ${to}`)
  console.log(`${opts.dryRun ? 'Would copy' : 'Copied'} ${plural(written.length, 'file')}.`)
  for (const k of KINDS) {
    const names = items.filter((i) => i.kind === k.key).map((i) => i.name)
    if (names.length || k.key === 'component') console.log(`${k.plural}: ${names.length ? names.join(', ') : 'none'}`)
  }
  const inside = (dir) => internal.filter((f) => f.startsWith(dir + sep)).map((f) => relative(dir, f))
  console.log(`Internal files: ${inside(INTERNAL).join(', ') || 'none'}`)
  if (inside(ICONS).length) console.log(`Icons: ${inside(ICONS).map((f) => `icons/${f}`).join(', ')}`)
  if (needs.size) {
    console.log('Dependencies:')
    for (const { item, deps } of needs.values()) console.log(`  ${item.name} needs ${[...deps.values()].map(label).join(', ')}`)
  }
  if (items.some(isPro)) console.log('Pro: part of Gooee UI Pro.')
  if (skipped.length) {
    console.log(`Skipped ${plural(skipped.length, 'existing file')}${opts.overwrite ? '' : ' (see what differs with diff, take the new version with update)'}:`)
    for (const s of skipped) console.log(`  ${s}`)
    if (skipped.some((s) => /^(tokens|base)\.css /.test(s))) console.log('  tokens.css and base.css are never replaced, so your theme edits stay.')
  }
  if (tokensNew) console.log(`Next: import tokens.css once ${fromEntry(opts.to || readConfig()?.to || DEFAULT_TO, false)} (or run init).`)
  if (items.some((i) => i.kind === 'theme')) console.log('Themes: import each one after tokens.css, then set data-theme-brand or data-density on <html>.')
}

// Compares the items (and what they import) with the copies in the project.
function compare(to, items, internal) {
  const copies = copiesFor(items, internal, to).map((c) => ({ ...c, state: state(c) }))
  return { copies, gone: goneFiles(to, items, copies) }
}

const walkFiles = (dir) => (isDir(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walkFiles(join(dir, d.name)) : [join(dir, d.name)])) : [])

// Files in an item's folder that start with our credit line, but that the latest version no longer has.
// One can go only when it is still exactly what the CLI wrote (its hash in gooee.json); otherwise it stays.
function goneFiles(to, items, copies) {
  const ours = new Set(copies.map((c) => c.to))
  const hashes = readConfig()?.files ?? {}
  return items
    .filter((item) => !kindOf(item.kind).single)
    .flatMap((item) => {
      const k = kindOf(item.kind)
      const latest = new Set(listFiles(join(k.dir, item.name)).map((f) => relative(k.dir, f)))
      return walkFiles(join(to, k.folder, item.name)).filter((f) => !ours.has(f) && !latest.has(relative(join(to, k.folder), f)))
    })
    .flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const body = withoutCredit(text)
      if (body === text) return []
      const saved = hashes[configKey(file)]
      return [{ file, remove: saved === hash(body), why: saved ? 'you changed it' : `${CONFIG} has no record of it` }]
    })
}

// Installed parts, besides the ones asked for, that import a shared file (internal/ or icons/) whose latest version differs.
function dependents(to, items, copies) {
  const sharedIn = (file) => ['internal', 'icons'].some((d) => file.startsWith(join(to, d) + sep))
  const changed = new Set(copies.filter((c) => c.state === 'changed' && sharedIn(c.to)).map((c) => c.to))
  if (!changed.size) return []
  const asked = new Set(items.map(keyOf))
  const local = (from, spec) => {
    const base = resolve(dirname(from), spec)
    return [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find(isFile)
  }
  const reach = new Map()
  const internalOf = (file) => {
    if (reach.has(file)) return reach.get(file)
    const found = new Set()
    reach.set(file, found)
    for (const spec of importsOf(file)) {
      const hit = local(file, spec)
      if (!hit || !sharedIn(hit)) continue
      found.add(hit)
      for (const f of internalOf(hit)) found.add(f)
    }
    return found
  }
  const fits = (f) => (f.endsWith('.vue') ? framework === 'vue' : f.endsWith('.tsx') ? framework === 'react' : /\.ts$/.test(f))
  const all = listItems()
  return KINDS.filter((k) => !k.single && isDir(join(to, k.folder))).flatMap((k) =>
    readdirSync(join(to, k.folder), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !asked.has(`${k.key}:${d.name}`))
      .flatMap((d) => {
        const uses = new Set(walkFiles(join(to, k.folder, d.name)).filter(fits).flatMap((f) => [...internalOf(f)].filter((i) => changed.has(i))))
        if (!uses.size) return []
        const item = all.find((i) => i.kind === k.key && i.name === d.name)
        return [{ name: d.name, item, uses: [...uses].map((f) => shown(to, f)).sort() }]
      }),
  )
}

function report(to, copies, gone, withLines) {
  const changed = copies.filter((c) => c.state === 'changed')
  const missing = copies.filter((c) => c.state === 'missing')
  for (const c of changed) {
    console.log(`\nChanged: ${shown(to, c.to)}`)
    if (withLines) for (const line of lineDiff(withoutCredit(readFileSync(c.to, 'utf8')), readFileSync(c.from, 'utf8'))) console.log(`  ${line}`)
  }
  for (const c of missing) console.log(`New: ${shown(to, c.to)}`)
  for (const g of gone) console.log(`Gone: ${shown(to, g.file)} (not in the latest version. ${g.remove ? 'update deletes it' : `update keeps it, since ${g.why}. Delete it yourself if nothing uses it`})`)
  const same = copies.length - changed.length - missing.length
  console.log(`\n${plural(changed.length, 'file')} changed, ${missing.length} new, ${gone.length} gone, ${same} up to date.`)
  if (withLines && changed.length) console.log('Lines with "-" are in your copy, lines with "+" are in the latest version.')
  return changed.length + missing.length + gone.length
}

function reportDependents(deps) {
  if (!deps.length) return
  console.log('\nThese installed parts use a shared file that changed, so they may need the update too:')
  for (const d of deps) console.log(`  ${d.name}${d.item ? '' : ' (your own part)'}: ${d.uses.join(', ')}`)
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = (await rl.question(`${question} (y/N) `)).trim().toLowerCase()
  rl.close()
  return answer === 'y' || answer === 'yes'
}

function runDiff(opts) {
  const all = listItems()
  const { to } = targetFolder(opts)
  const { items, internal } = plan(opts.names.map((n) => lookup(n, all)))
  const { copies, gone } = compare(to, items, internal)
  const count = report(to, copies, gone, true)
  const deps = dependents(to, items, copies)
  reportDependents(deps)
  const more = deps.filter((d) => d.item).map((d) => kebab(d.name))
  if (count) console.log(`\nTake the latest version: npx gooee update ${[...opts.names, ...more].join(' ')}`)
}

async function runUpdate(opts) {
  const all = listItems()
  const { to } = targetFolder(opts)
  const asked = opts.names.map((n) => lookup(n, all))
  let { items, internal } = plan(asked)
  let { copies, gone } = compare(to, items, internal)
  const deps = dependents(to, items, copies)
  reportDependents(deps)
  const extra = deps.filter((d) => d.item).map((d) => d.item)
  if (extra.length && !opts.dryRun) {
    const names = extra.map((i) => i.name).join(', ')
    if (!opts.yes && !process.stdin.isTTY) fail('update asks before replacing files. Run it in a terminal, or add --yes.', false)
    if (opts.yes || (await ask(`Update ${names} too?`))) {
      ;({ items, internal } = plan([...asked, ...extra]))
      ;({ copies, gone } = compare(to, items, internal))
      console.log(`Also updating ${names}.`)
    }
  }
  const todo = copies.filter((c) => c.state !== 'same')
  const remove = gone.filter((g) => g.remove)
  if (!todo.length && !gone.length) {
    console.log(`Everything is up to date (${plural(copies.length, 'file')}).`)
    return
  }
  report(to, copies, gone, false)
  if (!todo.length && !remove.length) return
  if (opts.dryRun) {
    console.log('Dry run, nothing written.')
    return
  }
  if (!opts.yes) {
    if (!process.stdin.isTTY) fail('update asks before replacing files. Run it in a terminal, or add --yes.', false)
    console.log('Your own edits in the changed files will be replaced. See them first with diff.')
    const what = [todo.length && `replace ${plural(todo.length, 'file')}`, remove.length && `delete ${plural(remove.length, 'file')}`].filter(Boolean).join(' and ')
    if (!(await ask(`${what[0].toUpperCase()}${what.slice(1)}?`))) {
      console.log('Nothing changed.')
      return
    }
  }
  for (const c of todo) writeCopy(c, false)
  for (const g of remove) rmSync(g.file)
  saveHashes(copies, remove.map((g) => g.file))
  console.log([todo.length && `Updated ${plural(todo.length, 'file')}.`, remove.length && `Deleted ${plural(remove.length, 'file')} the latest version no longer has.`].filter(Boolean).join(' '))
}

const tokenNames = (text) => new Set([...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))

// tokens.css is never replaced, so a new component can read a token the project's copy does not have yet.
function warnMissingTokens(opts) {
  const mine = join(targetFolder(opts).to, 'tokens.css')
  if (!isFile(mine)) return
  const latest = join(SRC, 'tokens.css')
  const text = readFileSync(latest, 'utf8')
  const have = tokenNames(readFileSync(mine, 'utf8'))
  const missing = [...tokenNames(text)].filter((name) => !have.has(name))
  if (!missing.length) return
  console.log(`\nYour tokens.css is missing ${plural(missing.length, 'token')} that the latest components use: ${missing.join(', ')}`)
  console.log(`Your file was not changed. Copy these lines from the latest tokens.css into ${shown(CWD, mine)}, each into the same block:`)
  // A token can be set in more than one block (dark theme, reduced motion), so every line is listed under its block.
  const blocks = new Map()
  const stack = []
  let selector = ''
  for (const line of text.split('\n').map((l) => l.trim())) {
    if (line.endsWith('{')) {
      stack.push(`${selector}${line.slice(0, -1)}`.trim())
      selector = ''
    } else if (line.startsWith('}')) stack.pop()
    else if (line.endsWith(',') && !line.includes(': ')) selector += `${line} `
    else if (missing.some((name) => line.startsWith(`${name}:`))) {
      const where = stack.join(' / ')
      blocks.set(where, [...(blocks.get(where) ?? []), line])
    }
  }
  for (const [where, found] of blocks) {
    console.log(`  In ${where}:`)
    for (const line of found) console.log(`    ${line}`)
  }
  console.log(`The latest file is at ${latest}`)
}

const opts = parseArgs(process.argv.slice(2))
framework = opts.framework || readConfig()?.framework || 'react'
if (!['react', 'vue'].includes(framework)) fail(`${CONFIG} has "framework": ${JSON.stringify(framework)}. Use "react" or "vue".`, false)
if (opts.command === 'init') runInit(opts)
else if (opts.command === 'list') runList(opts)
else if (opts.command === 'diff') runDiff(opts)
else if (opts.command === 'update') await runUpdate(opts)
else if (opts.command === 'add') runAdd(opts)
if (['add', 'diff', 'update'].includes(opts.command)) warnMissingTokens(opts)
