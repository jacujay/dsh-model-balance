// Built-in vendor table and provider matching.
//
// Matching order: provider id substring first, then the provider's baseURL
// hostname. `quotaOnly` vendors expose no monetary balance — only usage/limit
// plans (MiniMax, Zhipu).

export const VENDORS = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    match: /deepseek/,
    hostMatch: /api\.deepseek\.com/,
    defaultBaseURL: 'https://api.deepseek.com',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    auth: 'bearer',
    path: '/user/balance',
    quotaOnly: false,
    parse: (x) => {
      const b = Array.isArray(x.balance_infos) ? x.balance_infos[0] : undefined
      return {
        balance: b && b.total_balance !== undefined ? b.total_balance : null,
        currency: b && b.currency ? b.currency : 'CNY',
        grantedBalance: b && b.granted_balance !== undefined ? b.granted_balance : null,
        toppedUpBalance: b && b.topped_up_balance !== undefined ? b.topped_up_balance : null,
        available: x.is_available === true
      }
    }
  },
  {
    id: 'moonshot',
    label: 'Moonshot / Kimi',
    match: /moonshot|kimi/,
    hostMatch: /api\.moonshot\.cn/,
    defaultBaseURL: 'https://api.moonshot.cn',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    auth: 'bearer',
    path: '/v1/users/me/balance',
    quotaOnly: false,
    parse: (x) => {
      const d = x && typeof x === 'object' ? x.data : undefined
      if (!d) return { error: '响应格式无法识别' }
      const value = d.available_balance !== undefined ? d.available_balance : d.total_balance
      return {
        balance: value !== undefined ? value : null,
        currency: d.currency ? d.currency : 'CNY',
        grantedBalance: d.cash_balance !== undefined ? d.cash_balance : null,
        toppedUpBalance: d.voucher_balance !== undefined ? d.voucher_balance : null
      }
    }
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    match: /minimax/,
    hostMatch: /api\.minimax/,
    defaultBaseURL: 'https://api.minimaxi.com',
    apiKeyEnv: 'MINIMAX_API_KEY',
    auth: 'bearer',
    path: '/v1/token_plan/remains',
    quotaOnly: true,
    parse: (x) => {
      const resp = x && x.base_resp
      if (resp && resp.status_code && resp.status_code !== 0) {
        return { error: resp.status_msg || 'MiniMax 接口失败' }
      }
      const list = Array.isArray(x.model_remains) ? x.model_remains : []
      const quota = list.map((m) => {
        const percent = m.current_weekly_remaining_percent !== undefined
          ? m.current_weekly_remaining_percent
          : m.current_interval_remaining_percent
        const text = percent !== undefined
          ? `${percent}%`
          : (m.remains_time !== undefined ? `${Math.round(m.remains_time / 3600)}h` : '')
        return `${m.model_name}: ${text || '?'}`
      })
      return { quota: quota.length > 0 ? quota : ['无配额数据'], currency: 'CNY' }
    }
  },
  {
    id: 'stepfun',
    label: '阶跃星辰 StepFun',
    match: /stepfun/,
    hostMatch: /api\.stepfun\.com/,
    defaultBaseURL: 'https://api.stepfun.com',
    apiKeyEnv: 'STEP_API_KEY',
    auth: 'bearer',
    path: '/v1/accounts',
    quotaOnly: false,
    parse: (x) => {
      if (x && x.error) return { error: String(x.error.message || x.error) }
      return {
        balance: x.balance !== undefined ? x.balance : null,
        currency: 'CNY',
        grantedBalance: x.total_cash_balance !== undefined ? x.total_cash_balance : null,
        toppedUpBalance: x.total_voucher_balance !== undefined ? x.total_voucher_balance : null
      }
    }
  },
  {
    id: 'zhipu',
    label: '智谱 GLM（仅配额）',
    match: /zhipu|glm|bigmodel/,
    hostMatch: /bigmodel\.cn/,
    defaultBaseURL: 'https://open.bigmodel.cn',
    apiKeyEnv: 'ZHIPU_API_KEY',
    auth: 'raw',
    path: '/api/monitor/usage/quota/limit',
    quotaOnly: true,
    parse: (x) => {
      if (x && x.code !== undefined && x.code !== 200) return { error: x.msg || '智谱接口请求失败' }
      const limits = x && x.data && Array.isArray(x.data.limits) ? x.data.limits : []
      return { quota: limits.map((l) => `${l.remaining}/${l.number}`), currency: 'CNY' }
    }
  },
  {
    id: 'siliconflow',
    label: '硅基流动',
    match: /siliconflow/,
    hostMatch: /api\.siliconflow\.cn/,
    defaultBaseURL: 'https://api.siliconflow.cn',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    auth: 'bearer',
    path: '/v1/user/info',
    quotaOnly: false,
    parse: (x) => {
      if (x && x.error) return { error: typeof x.error === 'string' ? x.error : '硅基流动接口请求失败' }
      return { balance: x && x.balance !== undefined ? x.balance : null, currency: 'CNY' }
    }
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    match: /openrouter/,
    hostMatch: /openrouter\.ai/,
    defaultBaseURL: 'https://openrouter.ai',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    auth: 'bearer',
    path: '/api/v1/auth/key',
    quotaOnly: false,
    parse: (x) => {
      const d = x && typeof x === 'object' ? x.data : undefined
      if (!d) return { error: '响应格式无法识别' }
      if (d.limit === undefined || d.limit === null) {
        return { balance: null, unlimited: true, usage: d.usage, currency: 'USD' }
      }
      return { balance: d.limit - d.usage, usage: d.usage, limit: d.limit, currency: 'USD' }
    }
  }
]

export function matchVendor(provider, baseURL) {
  for (const vendor of VENDORS) {
    if (vendor.match.test(provider)) return vendor
  }
  for (const vendor of VENDORS) {
    if (baseURL && vendor.hostMatch.test(baseURL)) return vendor
  }
  return undefined
}
