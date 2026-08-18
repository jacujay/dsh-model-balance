// dsh-model-balance — host entry.
//
// Registers same-origin HTTP routes on the host `webServer` service that back
// the browser UI: current balance, vendor list, and custom endpoint config
// (GET/POST/DELETE). All network and credential work happens host-side; the
// API key never leaves this process.
//
// Note: static (bundle) plugins do not have the dynamic Cordis `harness`
// builtin, so Client→Host communication uses these routes instead of
// `harness.handle`/`host.call`.

import { queryBalance } from './query.js'
import { readCustom, writeCustom } from './config.js'
import { VENDORS } from './vendors.js'

export const name = 'model-balance'

function sendJson(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(data))
}

function readJsonBody(request) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolvePromise(text ? JSON.parse(text) : {})
      } catch (error) {
        rejectPromise(error)
      }
    })
    request.on('error', rejectPromise)
  })
}

// Loose same-origin guard for mutating routes: the Origin, when present, must
// share the request's Host. Same-origin browser fetches always carry Origin on
// POST; the guard is a sanity check, not an authentication layer.
function sameOrigin(request) {
  const origin = request.headers.origin
  const host = request.headers.host
  if (!origin || !host) return true
  try {
    return new URL(origin).host === host
  } catch (error) {
    return false
  }
}

export function apply(ctx) {
  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer
    const disposers = [
      webServer.register({
        kind: 'exact',
        path: '/api/model-balance/current',
        handler: async (request, response) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') {
            sendJson(response, 405, { error: 'method not allowed' })
            return
          }
          sendJson(response, 200, await queryBalance(ctx))
        }
      }),
      webServer.register({
        kind: 'exact',
        path: '/api/model-balance/vendors',
        handler: async (request, response) => {
          if (request.method !== 'GET' && request.method !== 'HEAD') {
            sendJson(response, 405, { error: 'method not allowed' })
            return
          }
          sendJson(response, 200, {
            vendors: VENDORS.map((vendor) => ({
              id: vendor.id,
              label: vendor.label,
              kind: vendor.quotaOnly ? 'quota' : 'balance'
            }))
          })
        }
      }),
      webServer.register({
        kind: 'exact',
        path: '/api/model-balance/custom',
        handler: async (request, response) => {
          if (request.method === 'GET' || request.method === 'HEAD') {
            sendJson(response, 200, readCustom())
            return
          }
          if (request.method === 'POST') {
            if (!sameOrigin(request)) {
              sendJson(response, 403, { error: 'forbidden' })
              return
            }
            let body
            try {
              body = await readJsonBody(request)
            } catch (error) {
              sendJson(response, 400, { error: 'invalid JSON body' })
              return
            }
            const provider = String(body.provider || '').trim()
            if (!provider) { sendJson(response, 400, { error: 'provider id 不能为空' }); return }
            const url = String(body.url || '').trim()
            if (!url) { sendJson(response, 400, { error: '接口 URL 不能为空' }); return }
            const path = String(body.path || '').trim()
            if (!path) { sendJson(response, 400, { error: '字段路径不能为空' }); return }
            const data = readCustom()
            data.custom = data.custom || {}
            data.custom[provider] = {
              url,
              auth: body.auth === 'raw' ? 'raw' : 'bearer',
              path,
              vendor: String(body.vendor || '').trim()
            }
            writeCustom(data)
            sendJson(response, 200, { ok: true, custom: data.custom })
            return
          }
          if (request.method === 'DELETE') {
            if (!sameOrigin(request)) {
              sendJson(response, 403, { error: 'forbidden' })
              return
            }
            let provider = ''
            try {
              provider = new URL(request.url || '', 'http://localhost').searchParams.get('provider') || ''
            } catch (error) {
              provider = ''
            }
            provider = provider.trim()
            const data = readCustom()
            if (data.custom && data.custom[provider]) {
              delete data.custom[provider]
              writeCustom(data)
            }
            sendJson(response, 200, { ok: true, custom: data.custom || {} })
            return
          }
          sendJson(response, 405, { error: 'method not allowed' })
        }
      })
    ]
    return () => disposers.forEach((dispose) => dispose())
  })
}
