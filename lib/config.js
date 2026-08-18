// Custom endpoint configuration persistence.
//
// Plain JSON at ~/.dsh/dsh-model-balance.json. No secrets are ever stored
// here — API keys keep coming from the DSH credentials store via
// `credentials.resolve` at query time.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

export const CONFIG_FILE = join(homedir(), '.dsh', 'dsh-model-balance.json')

export function readCustom() {
  try {
    if (!existsSync(CONFIG_FILE)) return { custom: {} }
    const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))
    return data && typeof data === 'object' ? data : { custom: {} }
  } catch (error) {
    return { custom: {} }
  }
}

export function writeCustom(data) {
  mkdirSync(join(homedir(), '.dsh'), { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2))
}

export function trimSlash(value) {
  let base = String(value)
  while (base.length > 0 && base[base.length - 1] === '/') base = base.slice(0, -1)
  return base
}

export function resolvePath(object, path) {
  if (typeof path !== 'string' || path === '') return undefined
  return String(path).split('.').reduce((acc, segment) => {
    if (acc === undefined || acc === null) return undefined
    const match = segment.match(/^(\w+)\[(\d+)\]$/)
    if (match) {
      const value = acc[match[1]]
      return Array.isArray(value) ? value[Number(match[2])] : undefined
    }
    return acc[segment]
  }, object)
}
