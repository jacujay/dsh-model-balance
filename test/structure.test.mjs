// Structural checks for dsh-model-balance, run by CI (no network, no build).
import { readFileSync, existsSync } from 'node:fs'
import assert from 'node:assert/strict'

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

// --- client bundle exports the cordis plugin shape ---
global.window = {
  __ModuleLoader__: {
    load: (spec) => {
      const React = {
        createElement: () => ({}),
        useState: () => [0, () => {}],
        useEffect: () => {}
      }
      globalThis.__bundleExports = spec.factory((name) => (name === 'react' ? React : {}))
    }
  }
}
await import(new URL('../client/client.js', import.meta.url))
const bundle = globalThis.__bundleExports
assert.ok(bundle, 'client factory must return module.exports')
assert.equal(bundle.name, 'model-balance', 'client plugin name must be model-balance')
assert.deepEqual(bundle.inject, ['slots'], 'client plugin must inject slots')
assert.equal(typeof bundle.apply, 'function', 'client plugin must export apply')
console.log('✓ client bundle shape')

// --- host entry exports ---
const host = await import(new URL('../lib/index.js', import.meta.url))
assert.equal(host.name, 'model-balance', 'host plugin name must be model-balance')
assert.equal(typeof host.apply, 'function', 'host plugin must export apply')
console.log('✓ host entry shape')

// --- manifests ---
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(pkg.name, 'dsh-model-balance')
assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml', 'dsh.bundle.patch required')
assert.equal(pkg.dsh?.client?.platform, 'web', 'dsh.client.platform must be web')
assert.doesNotMatch(pkg.description, /[\u4e00-\u9fff]/, 'package description must be English-only')
const englishReadme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
assert.doesNotMatch(englishReadme, /[\u4e00-\u9fff]/, 'English README must not contain CJK text')
const clientSource = readFileSync(new URL('../client/client.js', import.meta.url), 'utf8')
assert.match(clientSource, /function isChineseLocale\(\)/, 'client must support locale-aware labels')
for (const file of ['cordis.patch.yml', 'dsh.plugin.json', 'README.md', 'README.zh.md', 'LICENSE', 'client/client.js']) {
  assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `missing ${file}`)
}
console.log('✓ manifests')

console.log('all structure checks passed')
