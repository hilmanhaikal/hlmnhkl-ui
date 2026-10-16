#!/usr/bin/env node
// Copies components, blocks, templates and themes, and everything they import, into another project.
// Runs as `npx hlmnhkl-ui add <name>` from the npm package, or `npm run add -- <name>` in this repo.
// Plain JavaScript on purpose: the project has no Node type package.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const INTERNAL = join(SRC, 'internal')
const EXCLUDED = /(\.(test|spec|stories|demo)\.[jt]sx?$)|(^|\/)(docs|demos|__tests__)\//
const DEFAULT_TO = 'src/ui'
const USAGE = `Usage: npx hlmnhkl-ui add <name> [<name>...] [--to <folder>] [--overwrite] [--dry-run] [--with-base]
  --to defaults to ${DEFAULT_TO}. In this repo, run: npm run add -- <name> --to <folder>`

// A theme is one CSS file; every other kind is a folder per name. Each kind keeps its folder name in the target.
const KINDS = [
  { key: 'component', plural: 'Components', folder: 'components', pro: false },
  { key: 'block', plural: 'Blocks', folder: 'blocks', pro: true },
  { key: 'template', plural: 'Templates', folder: 'templates', pro: true },
  { key: 'theme', plural: 'Themes', folder: 'themes', pro: true, single: true },
].map((k) => ({ ...k, dir: join(SRC, k.folder) }))

function fail(message) {
  console.error(`Error: ${message}`)
  console.error(USAGE)
  process.exit(1)
}

function parseArgs(argv) {
  const opts = { names: [], to: '', overwrite: false, dryRun: false, withBase: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      console.log(USAGE)
      console.log('A name can be a component (Button), a block (Dashboard), a template or a theme (forest).')
      console.log('When two kinds share a name, add the kind: blocks/Settings, templates/Settings.')
      process.exit(0)
    } else if (arg === '--to') {
      opts.to = argv[++i] ?? ''
      if (!opts.to || opts.to.startsWith('--')) fail('--to needs a folder, for example --to ../my-app/src/ui')
    } else if (arg.startsWith('--to=')) opts.to = arg.slice(5)
    else if (arg === '--overwrite') opts.overwrite = true
    else if (arg === '--dry-run') opts.dryRun = true
    else if (arg === '--with-base') opts.withBase = true
    else if (arg.startsWith('-')) fail(`Unknown option ${arg}.`)
    else opts.names.push(arg)
  }
  // `npx hlmnhkl-ui add button` passes "add" first, like shadcn.
  if (opts.names[0] === 'add') opts.names.shift()
  if (!opts.names.length) fail('Name at least one component, block, template or theme, for example button.')
  if (!opts.to) opts.to = DEFAULT_TO
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
  const pro = proComponents().find((p) => p.toLowerCase() === name.toLowerCase())
  if (pro) fail(`${pro} is in hlmnhkl/ui Pro, so it is not in this package. See https://ui.hlmnhkl.my/${raw.toLowerCase()}`)
  const close = suggest(name, all)
  fail(`There is no component, block, template or theme called "${raw}".${close.length ? ` Did you mean ${close.join(', ')}?` : ''}`)
}

// Only in the public package: the names of Pro components, so asking for one gets a clear answer.
function proComponents() {
  const file = join(ROOT, 'scripts', 'pro-components.json')
  return isFile(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (EXCLUDED.test(rel(p) + (d.isDirectory() ? '/' : ''))) return []
    return d.isDirectory() ? listFiles(p) : [p]
  })
}

const filesOf = (item) => {
  const k = kindOf(item.kind)
  return k.single ? [join(k.dir, `${item.name}.css`)] : listFiles(join(k.dir, item.name))
}

function importsOf(file) {
  if (!/\.(ts|tsx)$/.test(file)) return []
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
  if (!hit) fail(`${rel(from)} imports "${spec}", but no such file exists.`)
  return hit
}

// Which component, block, template or theme a file belongs to, or null for src/internal.
function ownerOf(file) {
  if (file.startsWith(INTERNAL + sep)) return null
  for (const k of KINDS) {
    if (!file.startsWith(k.dir + sep)) continue
    if (k.single) return { kind: k.key, name: basename(file, '.css') }
    return { kind: k.key, name: relative(k.dir, file).split(sep)[0] }
  }
  fail(`${rel(file)} is outside src/components, src/blocks, src/templates, src/themes and src/internal, so it cannot be copied.`)
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
      if (ownerOf(target) !== null) fail(`${rel(seenInternal[i])} imports from outside src/internal, which internal files must not do.`)
      visitInternal(target)
    }
  }
  return { items: [...picked.values()], internal: [...internal].sort(), needs }
}

const opts = parseArgs(process.argv.slice(2))
const all = listItems()
const asked = opts.names.map((n) => lookup(n, all))

// npm runs scripts from the repo root; INIT_CWD is the folder the command was typed in.
const to = resolve(process.env.INIT_CWD ?? process.cwd(), opts.to)
if (existsSync(to) && !isDir(to)) fail(`--to points at a file, not a folder: ${opts.to}`)

const { items, internal, needs } = plan(asked)

const copies = []
for (const item of items) {
  const k = kindOf(item.kind)
  for (const file of filesOf(item)) copies.push({ from: file, to: join(to, k.folder, relative(k.dir, file)) })
}
for (const file of internal) copies.push({ from: file, to: join(to, 'internal', relative(INTERNAL, file)) })

const sheets = [{ from: join(SRC, 'tokens.css'), to: join(to, 'tokens.css') }]
if (opts.withBase) sheets.push({ from: join(SRC, 'base.css'), to: join(to, 'base.css') })

const written = []
const skipped = []
const write = ({ from, to: dest }, allowOverwrite) => {
  const shown = relative(to, dest).split(sep).join('/')
  if (existsSync(dest) && !allowOverwrite) {
    const same = readFileSync(dest).equals(readFileSync(from))
    skipped.push(`${shown} (${same ? 'already there, same' : 'already there, different'})`)
    return false
  }
  if (!opts.dryRun) {
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(from, dest)
  }
  written.push(shown)
  return true
}

for (const c of copies) write(c, opts.overwrite)
// Stylesheets hold the app's own theme edits, so they are never replaced.
const tokensNew = write(sheets[0], false)
if (sheets[1]) write(sheets[1], false)

const verb = opts.dryRun ? 'Would copy' : 'Copied'
console.log(`${opts.dryRun ? 'Dry run, nothing written. ' : ''}Target: ${to}`)
console.log(`${verb} ${written.length} file${written.length === 1 ? '' : 's'}.`)
for (const k of KINDS) {
  const names = items.filter((i) => i.kind === k.key).map((i) => i.name)
  if (names.length || k.key === 'component') console.log(`${k.plural}: ${names.length ? names.join(', ') : 'none'}`)
}
console.log(`Internal files: ${internal.length ? internal.map((f) => relative(INTERNAL, f)).join(', ') : 'none'}`)
if (needs.size) {
  console.log('Dependencies:')
  for (const { item, deps } of needs.values()) console.log(`  ${item.name} needs ${[...deps.values()].map(label).join(', ')}`)
}
if (items.some((i) => kindOf(i.kind).pro)) console.log('Pro: part of hlmnhkl/ui Pro.')
if (skipped.length) {
  console.log(`Skipped ${skipped.length} existing file${skipped.length === 1 ? '' : 's'}${opts.overwrite ? '' : ' (use --overwrite to replace them)'}:`)
  for (const s of skipped) console.log(`  ${s}`)
  if (skipped.some((s) => /^(tokens|base)\.css /.test(s))) console.log('  tokens.css and base.css are never replaced, so your theme edits stay.')
}
if (tokensNew) console.log(`Next: import ${join(opts.to, 'tokens.css')} once at your app root.`)
if (items.some((i) => i.kind === 'theme')) {
  console.log('Themes: import each one after tokens.css, then set data-theme-brand or data-density on <html>.')
}
