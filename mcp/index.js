#!/usr/bin/env node
// The hlmnhkl/ui MCP server, published on its own as hlmnhkl-ui-mcp (see publish-free), so AI coding tools
// can ask what the library holds. It only reads mcp-docs.json next to it: it writes no files, runs no
// commands and fetches nothing, and Pro items are a name and one line. Answers go out on stdout, so nothing
// else may print there.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), 'mcp-docs.json')
let docs
try {
  docs = JSON.parse(readFileSync(DOCS, 'utf8'))
} catch {
  console.error(`hlmnhkl-ui-mcp: cannot read ${DOCS}. It ships in the npm package; in the private repo, run publish-free first.`)
  process.exit(1)
}

const KINDS = { components: 'component', blocks: 'block', templates: 'template', themes: 'theme' }
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const NAME = { type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9 _/-]+$', description: 'A name or id, such as Button, date-picker or blocks/Settings.' }

const squash = (s) => s.toLowerCase().replace(/[-_\s]/g, '')
const text = (body) => ({ content: [{ type: 'text', text: body }] })
const proNote = (i) => `${i.name} is in hlmnhkl/ui Pro. It is not in the free package, so it cannot be added with the CLI. See ${i.docs}`

// "date-picker" finds DatePicker; "blocks/Settings" picks one kind when two share a name.
function find(raw) {
  const slash = raw.indexOf('/')
  const kind = slash > 0 ? KINDS[raw.slice(0, slash).toLowerCase()] : undefined
  const name = squash(slash > 0 ? raw.slice(slash + 1) : raw)
  return docs.items.find((i) => (!kind || i.kind === kind) && (squash(i.id) === name || squash(i.name) === name))
}

// Letters to change to turn a into b, so "Buton" still finds Button. The same rule as the CLI.
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

function notFound(raw) {
  const want = squash(raw)
  const score = (n) => (n.includes(want) || want.includes(n) ? 0 : distance(want, n))
  const close = docs.items
    .map((i) => ({ i, s: score(squash(i.name)) }))
    .filter(({ s }) => s <= Math.max(2, Math.floor(want.length / 3)))
    .sort((a, b) => a.s - b.s)
    .slice(0, 3)
    .map(({ i }) => i)
  const hint = close.length ? ` Did you mean ${close.map((i) => i.name).join(', ')}?` : ''
  return { ...text(`There is nothing called "${raw}".${hint} list_components shows every name.`), isError: true }
}

function describe(i) {
  const lines = [`# ${i.name}`, '', i.description, '', `Install: \`${i.install}\``]
  lines.push(`Import: \`import { ${i.exports.join(', ')} } from './ui/components/${i.name}'\` (from src/, the default folder)`, `Docs: ${i.docs}`, '')
  if (i.a11y.length) lines.push('Accessibility:', ...i.a11y.map((a) => `- ${a}`), '')
  for (const p of i.props) lines.push(`## ${p.component} props`, '', p.table, '')
  if (i.example) lines.push('Example:', '', '```tsx', i.example, '```')
  return lines.join('\n')
}

function createServer() {
  const server = new McpServer(
    { name: 'hlmnhkl-ui', version: docs.version },
    { instructions: [`hlmnhkl/ui ${docs.version}: React components copied into the project. ${docs.site}`, ...docs.rules.map((r) => `- ${r}`)].join('\n') },
  )

  server.registerTool(
    'list_components',
    {
      title: 'List hlmnhkl/ui components',
      description: 'Every component, block, template and theme in hlmnhkl/ui, with one line each and whether it is free or Pro.',
      inputSchema: fromJsonSchema({
        type: 'object',
        properties: {
          kind: { type: 'string', enum: Object.keys(KINDS), description: 'Only this kind.' },
          tier: { type: 'string', enum: ['free', 'pro'], description: 'Only free (installable) or only Pro.' },
        },
        additionalProperties: false,
      }),
      annotations: READ_ONLY,
    },
    async ({ kind, tier }) => {
      const items = docs.items.filter((i) => (!kind || i.kind === KINDS[kind]) && (!tier || i.tier === tier))
      const lines = items.map((i) => `- ${i.name} (${i.kind}${i.tier === 'pro' ? ', Pro' : ''}): ${i.description}`)
      return text(`${items.length} of ${docs.items.length} items. Only free items can be added with the CLI.\n\n${lines.join('\n')}`)
    },
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get one hlmnhkl/ui component',
      description: 'For a free component: what it does, the install and import lines, accessibility notes, its props and an example. For Pro: one line and the docs link.',
      inputSchema: fromJsonSchema({ type: 'object', properties: { name: NAME }, required: ['name'], additionalProperties: false }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      const item = find(name)
      if (!item) return notFound(name)
      return text(item.tier === 'pro' ? proNote(item) : describe(item))
    },
  )

  server.registerTool(
    'get_install_steps',
    {
      title: 'Get install steps for hlmnhkl/ui components',
      description: 'The commands and imports to add free components to a React project: init once, one add command, then the imports.',
      inputSchema: fromJsonSchema({
        type: 'object',
        properties: { names: { type: 'array', items: NAME, minItems: 1, maxItems: 20, description: 'The components to add.' } },
        required: ['names'],
        additionalProperties: false,
      }),
      annotations: READ_ONLY,
    },
    async ({ names }) => {
      const found = names.map((n) => [n, find(n)])
      const missing = found.find(([, i]) => !i)
      if (missing) return notFound(missing[0])
      const free = found.map(([, i]) => i).filter((i) => i.tier === 'free')
      const pro = found.map(([, i]) => i).filter((i) => i.tier === 'pro')
      const lines = []
      if (free.length) {
        lines.push(
          'From the project folder:',
          '1. Once per project: `npx hlmnhkl-ui@latest init` (adds src/ui/tokens.css, src/ui/base.css and hlmnhkl-ui.json).',
          `2. \`npx hlmnhkl-ui@latest add ${free.map((i) => i.id).join(' ')}\` (their imports come along).`,
          "3. Once at the app root, tokens first: `import './ui/tokens.css'` then `import './ui/base.css'`.",
          '4. In your code:',
          ...free.map((i) => `   import { ${i.exports.join(', ')} } from './ui/components/${i.name}'`),
        )
      }
      if (pro.length) lines.push('', ...pro.map(proNote))
      return text(lines.join('\n').trim())
    },
  )

  return server
}

serveStdio(createServer)
