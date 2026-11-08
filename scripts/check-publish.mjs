// Runs before npm publish. The package must hold only the files it lists, no dependencies and no
// install scripts, and stay small, so a bad change cannot ride out to every app that runs add.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const problems = []
if (pkg.dependencies && Object.keys(pkg.dependencies).length) problems.push('it has dependencies')
for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) if (pkg.scripts?.[hook]) problems.push(`it has a ${hook} script`)

const [packed] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' }))
const ok = [/^package\.json$/, /^(README|LICENSE|CHANGELOG)(\.md)?$/, /^scripts\/(add\.js|pro-components\.json)$/, /^src\/(components|internal)\//, /^src\/(tokens|base)\.css$/]
for (const { path } of packed.files) if (!ok.some((re) => re.test(path))) problems.push(`unexpected file: ${path}`)
if (packed.unpackedSize > 3_000_000) problems.push(`too big: ${packed.unpackedSize} bytes unpacked`)

if (problems.length) {
  console.error(`Not publishing:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`Publish check passed: ${packed.files.length} files, ${packed.unpackedSize} bytes unpacked.`)
