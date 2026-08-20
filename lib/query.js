// Balance query orchestration.
//
// Reads the current default model's provider from DSH configuration,
// identifies the vendor, resolves the API key host-side, calls the vendor's
// balance/quota endpoint, and returns a small plain-JSON result object.

import { matchVendor } from './vendors.js'
import { readCustom, trimSlash, resolvePath as resolvePathFor } from './config.js'

export const REQUEST_TIMEOUT_MS = 15000

function currentRoute(ctx) {
  const selected = ctx.get('agentDefaultModel')
  let selection
  try {
    selection = selected === undefined ? undefined : selected.currentSelection()
  } catch (error) {
    selection = undefined
  }
  const llm = ctx.get('llm')
  const provider = selection && typeof selection.provider === 'string'
    ? selection.provider
    : (llm === undefined ? undefined : llm.listProviders()[0]?.id)
  return {
    provider,
    model: selection && typeof selection.model === 'string' ? selection.model : ''
  }
}

function connectionFor(ctx, provider) {
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  if (llm === undefined || settings === undefined || typeof llm.listConfigurableProviders !== 'function') {
    return {}
  }
  const entry = llm.listConfigurableProviders().find((item) => item.provider === provider)
  if (entry === undefined) return {}
  const descriptor = settings.describe({ redactSecrets: true }).find(
    (item) => String(item.ns) === String(entry.settingsNs)
  )
  if (descriptor === undefined) return {}
  const profile = (entry.settingsPath ?? []).reduce(
    (value, key) => (typeof value === 'object' && value !== null ? value[key] : undefined),
    descriptor.value
  )
  if (typeof profile !== 'object' || profile === null) return {}
  return {
    apiKeyEnv: typeof profile.apiKeyEnv === 'string' ? profile.apiKeyEnv : '',
    baseURL: typeof profile.baseURL === 'string' ? profile.baseURL : ''
  }
}

function failure(provider, model, error) {
  return { status: 'error', provider: provider || '', model: model || '', error: error || 'Balance lookup failed' }
}

export async function queryBalance(ctx) {
  const route = currentRoute(ctx)
  if (!route.provider) return failure('', route.model, 'No default model is configured')

  const connection = connectionFor(ctx, route.provider)
  const baseURL = connection.baseURL || ''
  const custom = readCustom()
  const customEntry = custom.custom && custom.custom[route.provider]
  const vendor = customEntry ? undefined : matchVendor(route.provider, baseURL)

  let endpoint
  let auth
  let apiKeyEnv
  let source = 'auto'
  if (customEntry) {
    endpoint = trimSlash(customEntry.url || '')
    auth = customEntry.auth === 'raw' ? 'raw' : 'bearer'
    apiKeyEnv = connection.apiKeyEnv || ''
    source = 'custom'
  } else if (vendor) {
    endpoint = trimSlash(baseURL || vendor.defaultBaseURL) + vendor.path
    auth = vendor.auth
    apiKeyEnv = connection.apiKeyEnv || vendor.apiKeyEnv
  } else {
    return {
      status: 'unsupported',
      provider: route.provider,
      model: route.model,
      label: route.provider,
      error: 'This provider has no public balance endpoint'
    }
  }

  if (!endpoint) return failure(route.provider, route.model, 'No balance endpoint is configured')
  if (!apiKeyEnv) return failure(route.provider, route.model, 'No API key environment variable is configured')

  const credentials = ctx.get('credentials')
  if (credentials === undefined) return failure(route.provider, route.model, 'Credentials service is unavailable')
  const hit = await credentials.resolve(apiKeyEnv)
  if (hit === undefined) return failure(route.provider, route.model, `Credential ${apiKeyEnv} is not configured`)

  const authHeader = auth === 'raw' ? hit.value : `Bearer ${hit.value}`

  let json
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
    if (!response.ok) {
      return failure(route.provider, route.model, `HTTP ${response.status}`)
    }
    json = await response.json()
  } catch (error) {
    const message = error instanceof Error ? String(error.message) : String(error)
    return failure(route.provider, route.model, message.slice(0, 120) || 'Balance request failed')
  }

  if (customEntry) {
    // New API's token-usage endpoint returns a structured quota object. Keep
    // this compatibility path automatic so users only need to provide its URL
    // and their ordinary provider API key.
    const tokenUsage = json && json.data && json.data.object === 'token_usage' ? json.data : undefined
    if (tokenUsage) {
      return {
        status: 'ok',
        provider: route.provider,
        model: route.model,
        source: 'custom',
        vendor: null,
        vendorLabel: customEntry.vendor || route.provider,
        label: customEntry.vendor || route.provider,
        balance: tokenUsage.unlimited_quota === true ? null : tokenUsage.total_available,
        currency: '',
        usage: tokenUsage.total_used,
        limit: tokenUsage.total_granted,
        unlimited: tokenUsage.unlimited_quota === true
      }
    }
    const value = resolvePathFor(json, customEntry.path)
    return {
      status: 'ok',
      provider: route.provider,
      model: route.model,
      source: 'custom',
      vendor: null,
      vendorLabel: customEntry.vendor || route.provider,
      label: customEntry.vendor || route.provider,
      balance: value === undefined || value === null ? null : value,
      currency: ''
    }
  }

  const parsed = vendor.parse(json)
  if (parsed.error) return failure(route.provider, route.model, parsed.error)
  const status = vendor.quotaOnly || parsed.quota ? 'quota' : 'ok'
  return {
    status,
    provider: route.provider,
    model: route.model,
    source,
    vendor: vendor.id,
    vendorLabel: vendor.label,
    vendorLabelZh: vendor.labelZh || vendor.label,
    label: vendor.label,
    currency: parsed.currency || '',
    balance: parsed.balance !== undefined ? parsed.balance : null,
    grantedBalance: parsed.grantedBalance !== undefined ? parsed.grantedBalance : null,
    toppedUpBalance: parsed.toppedUpBalance !== undefined ? parsed.toppedUpBalance : null,
    usage: parsed.usage !== undefined ? parsed.usage : null,
    limit: parsed.limit !== undefined ? parsed.limit : null,
    unlimited: parsed.unlimited === true,
    quota: parsed.quota || null
  }
}
