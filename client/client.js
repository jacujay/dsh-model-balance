// dsh-model-balance — client half.
//
// A balance/quota button in the native composer input row (left of the model
// name) plus a Balance lookup settings page. All data comes from the host over
// same-origin HTTP routes; API keys never reach the browser.
//
// This file ships in the DSH browser module-loader format
// (window.__ModuleLoader__.load({ id, factory })) — the same shape the
// official client bundles are built into — so it needs no bundler.
window.__ModuleLoader__.load({
  id: 'dsh-model-balance',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    var css = [
      '.dsh-model-balance-input{position:relative;display:inline-flex;align-items:center;height:28px;flex:none}',
      '.dsh-model-balance-input__button{box-sizing:border-box;width:22px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,#8b8b8b);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:11px;line-height:1}',
      '.dsh-model-balance-input__button:hover,.dsh-model-balance-input__button[aria-expanded="true"]{border-color:var(--dsw-alias-state-business-primary,#4d8dff);color:var(--dsw-alias-state-business-primary,#4d8dff);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}',
      '.dsh-model-balance-input__button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d8dff);outline-offset:1px}',
      '.dsh-model-balance-input__button[data-state="error"],.dsh-model-balance-input__button[data-state="unsupported"]{color:var(--dsw-alias-state-danger,#d34b4b)}',
      '.dsh-model-balance-input__button[data-state="quota"]{color:var(--dsw-alias-state-warning,#c9a227)}',
      '.dsh-model-balance-input__panel{position:absolute;z-index:30;left:50%;bottom:31px;transform:translateX(-50%);width:240px;padding:10px 11px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:7px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#222);box-shadow:0 6px 18px rgba(0,0,0,.16);font-size:12px;line-height:1.45}',
      '.dsh-model-balance-input__title{font-weight:600;margin-bottom:5px}',
      '.dsh-model-balance-input__line{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.dsh-model-balance-input__muted{color:var(--dsw-alias-label-secondary,#888)}',
      '.dsh-model-balance-input__amount{margin:3px 0;font-size:14px;font-variant-numeric:tabular-nums}',
      '.dsh-model-balance-settings{padding:2px 0 12px;font-size:13px;line-height:1.6}',
      '.dsh-model-balance-settings__hint{color:var(--dsw-alias-label-secondary,#888);font-size:12px}',
      '.dsh-model-balance-settings__vendor{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.14));padding:5px 0;font-size:12.5px}',
      '.dsh-model-balance-settings__badge{font-size:11px;color:var(--dsw-alias-label-secondary,#888);border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.22));border-radius:4px;padding:0 5px;white-space:nowrap}',
      '.dsh-model-balance-settings__form{display:flex;flex-direction:column;gap:7px;margin-top:10px}',
      '.dsh-model-balance-settings__field{display:flex;flex-direction:column;gap:3px}',
      '.dsh-model-balance-settings__label{font-size:12px;color:var(--dsw-alias-label-secondary,#888)}',
      '.dsh-model-balance-settings__input{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:6px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#222);padding:5px 8px;font-size:12.5px}',
      '.dsh-model-balance-settings__input:focus{outline:2px solid var(--dsw-alias-state-business-primary,#4d8dff);outline-offset:0}',
      '.dsh-model-balance-settings__actions{display:flex;gap:8px;align-items:center;margin-top:4px}',
      '.dsh-model-balance-settings__btn{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:6px;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1));color:var(--dsw-alias-label-primary,#222);padding:4px 12px;font-size:12.5px;cursor:pointer}',
      '.dsh-model-balance-settings__btn:hover{border-color:var(--dsw-alias-state-business-primary,#4d8dff)}',
      '.dsh-model-balance-settings__row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.14));padding:5px 0;font-size:12.5px}',
      '.dsh-model-balance-settings__del{border:none;background:none;color:var(--dsw-alias-state-danger,#d34b4b);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px}',
      '.dsh-model-balance-settings__del:hover{background:var(--dsw-alias-interactive-bg-hover-danger,rgba(211,75,75,.12))}'
    ].join('\n')

    var STYLE_ID = 'dsh-model-balance-style'

    function injectStyle() {
      if (document.getElementById(STYLE_ID)) return function () {}
      var style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = css
      document.head.appendChild(style)
      return function () {
        if (style.parentNode) style.parentNode.removeChild(style)
      }
    }

    function getJson(path, options) {
      return fetch(path, options).then(function (response) {
        return response.json()
      })
    }

    function isChineseLocale() {
      try {
        var lang = (document.documentElement && document.documentElement.lang) ||
          (typeof navigator !== 'undefined' ? navigator.language : '') || ''
        return /^zh(?:-|$)/i.test(lang)
      } catch (error) {
        return false
      }
    }

    var chinese = isChineseLocale()
    function text(english, chineseText) {
      return chinese ? chineseText : english
    }

    function amountOf(state) {
      if (state.status === 'loading') return text('Checking...', '查询中')
      if (state.status === 'unsupported') return text('No endpoint', '无接口')
      if (state.status === 'error') return text('Unavailable', '不可用')
      if (state.status === 'quota') return text('Quota', '配额')
      var value = state.balance !== undefined && state.balance !== null ? state.balance
        : state.totalBalance !== undefined && state.totalBalance !== null ? state.totalBalance
        : state.grantedBalance !== undefined && state.grantedBalance !== null ? state.grantedBalance
        : state.toppedUpBalance !== undefined && state.toppedUpBalance !== null ? state.toppedUpBalance
        : null
      if (value === null) return state.unlimited === true ? text('Unlimited', '无限额度') : text('Unknown', '未知')
      var num = Number(value)
      var formatted = Number.isFinite(num) ? (Math.round(num * 100) / 100).toString() : String(value)
      return state.currency ? state.currency + ' ' + formatted : formatted
    }

    function BalanceInputButton() {
      var stateHook = React.useState({ status: 'loading' })
      var state = stateHook[0]
      var setState = stateHook[1]
      var openHook = React.useState(false)
      var open = openHook[0]
      var setOpen = openHook[1]

      var refresh = function () {
        setState({ status: 'loading' })
        getJson('/api/model-balance/current').then(function (value) {
          setState(value && typeof value === 'object' ? value : { status: 'error', error: text('Invalid response', '无效响应') })
        }).catch(function () {
          setState({ status: 'error', error: text('Balance lookup failed', '余额查询失败') })
        })
      }

      React.useEffect(function () {
        refresh()
        return undefined
      }, [])

      var amount = amountOf(state)
      var vendorLabel = chinese && state.vendorLabelZh ? state.vendorLabelZh : state.label
      var title = state.error || (vendorLabel
        ? vendorLabel + ' ' + text('balance, click to refresh', '余额，点击刷新')
        : text('Current model balance, click to refresh', '当前模型余额，点击刷新'))
      var rows = []
      if (vendorLabel) rows.push([text('Vendor', '厂商'), vendorLabel])
      if (state.model) rows.push([text('Model', '模型'), state.model])
      if (state.status === 'ok') {
        if (state.grantedBalance !== undefined && state.grantedBalance !== null) rows.push([text('Cash', '现金'), (state.currency || '') + ' ' + state.grantedBalance])
        if (state.toppedUpBalance !== undefined && state.toppedUpBalance !== null) rows.push([text('Topped up', '赠金'), (state.currency || '') + ' ' + state.toppedUpBalance])
        if (state.usage !== undefined && state.usage !== null) rows.push([text('Used', '已用'), state.usage])
        if (state.unlimited === true) rows.push([text('Quota', '额度'), text('Unlimited', '无限 / 免费档')])
        if (state.source === 'custom') rows.push([text('Source', '来源'), text('Custom endpoint', '自定义接口')])
      }
      if (state.status === 'quota' && Array.isArray(state.quota)) rows.push([text('Quota', '配额'), state.quota.join(chinese ? '，' : ', ')])
      if (state.error) rows.push([text('Notice', '提示'), state.error])

      return React.createElement('span', {
        className: 'dsh-model-balance-input',
        onMouseEnter: function () { setOpen(true) },
        onMouseLeave: function () { setOpen(false) }
      },
        React.createElement('button', {
          className: 'dsh-model-balance-input__button',
          type: 'button',
          'data-state': state.status,
          'aria-label': title,
          'aria-expanded': open,
          title: title,
          onFocus: function () { setOpen(true) },
          onBlur: function () { setOpen(false) },
          onMouseDown: function (event) { event.preventDefault() },
          onClick: function () {
            setOpen(!open)
            refresh()
          }
        }, '◈'),
        open ? React.createElement('div', {
          className: 'dsh-model-balance-input__panel',
          role: 'status'
        },
          React.createElement('div', { className: 'dsh-model-balance-input__title' }, state.status === 'unsupported' ? text('Balance lookup', '余额查询') : text('Model balance', '模型余额')),
          React.createElement('div', { className: 'dsh-model-balance-input__amount' }, amount),
          rows.map(function (row) {
            return React.createElement('div', {
              className: 'dsh-model-balance-input__line' + (row[0] === text('Notice', '提示') ? ' dsh-model-balance-input__muted' : ''),
              key: row[0]
            }, row[0] + '：' + row[1])
          }),
          state.status === 'unsupported'
            ? React.createElement('div', { className: 'dsh-model-balance-input__line dsh-model-balance-input__muted' }, text('Add a custom endpoint in Settings → Balance lookup', '可在 设置 → 余额查询 中添加自定义接口'))
            : null
        ) : null
      )
    }

    function BalanceSettingsPage() {
      var dataHook = React.useState({ vendors: [], custom: {}, loaded: false })
      var data = dataHook[0]
      var setData = dataHook[1]
      var formHook = React.useState({ provider: '', url: '', auth: 'bearer', path: '', vendor: '' })
      var form = formHook[0]
      var setForm = formHook[1]
      var noticeHook = React.useState('')
      var notice = noticeHook[0]
      var setNotice = noticeHook[1]

      var reload = function () {
        Promise.all([
          getJson('/api/model-balance/vendors').then(function (r) { return (r && r.vendors) || [] }).catch(function () { return [] }),
          getJson('/api/model-balance/custom').then(function (r) { return (r && r.custom) || {} }).catch(function () { return {} })
        ]).then(function (results) {
          setData({ vendors: results[0], custom: results[1], loaded: true })
        })
      }

      React.useEffect(function () {
        reload()
        return undefined
      }, [])

      var save = function () {
        var provider = form.provider.trim()
        if (!provider) { setNotice(text('Enter a provider id', '请填写 provider id')); return }
        if (!form.url.trim()) { setNotice(text('Enter an endpoint URL', '请填写接口 URL')); return }
        if (!form.path.trim()) { setNotice(text('Enter a response field path', '请填写响应字段路径')); return }
        getJson('/api/model-balance/custom', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            provider: provider,
            url: form.url.trim(),
            auth: form.auth,
            path: form.path.trim(),
            vendor: form.vendor.trim()
          })
        }).then(function (r) {
          if (r && r.error) { setNotice(r.error); return }
          setNotice(text('Saved', '已保存'))
          setForm({ provider: '', url: '', auth: 'bearer', path: '', vendor: '' })
          reload()
        }).catch(function () { setNotice(text('Save failed', '保存失败')) })
      }

      var remove = function (provider) {
        getJson('/api/model-balance/custom?provider=' + encodeURIComponent(provider), { method: 'DELETE' }).then(function () {
          setNotice(text('Deleted', '已删除'))
          reload()
        }).catch(function () { setNotice(text('Delete failed', '删除失败')) })
      }

      if (!data.loaded) {
        return React.createElement('div', { className: 'dsh-model-balance-settings' }, text('Loading...', '加载中…'))
      }

      return React.createElement('div', { className: 'dsh-model-balance-settings' },
        React.createElement('div', { className: 'dsh-model-balance-settings__hint' }, text('The current model vendor is detected automatically. Add an endpoint for unsupported vendors.', '自动识别当前模型厂商并查询余额；未内置的厂商可手动添加接口。')),
        React.createElement('div', { style: { marginTop: 8 } },
          React.createElement('div', { style: { fontWeight: 600, marginBottom: 4 } }, text('Built-in vendors', '自动支持的厂商')),
          data.vendors.map(function (v) {
            return React.createElement('div', { className: 'dsh-model-balance-settings__vendor', key: v.id },
              React.createElement('span', null, chinese && v.labelZh ? v.labelZh : v.label),
              React.createElement('span', { className: 'dsh-model-balance-settings__badge' }, v.kind === 'quota' ? text('Quota only', '仅配额') : text('Balance', '余额'))
            )
          })
        ),
        React.createElement('div', { style: { marginTop: 10 } },
          React.createElement('div', { style: { fontWeight: 600, marginBottom: 4 } }, text('Custom endpoints', '自定义接口')),
          Object.keys(data.custom).length === 0
            ? React.createElement('div', { className: 'dsh-model-balance-settings__hint' }, text('No custom endpoints', '暂无自定义接口'))
            : Object.keys(data.custom).map(function (provider) {
              return React.createElement('div', { className: 'dsh-model-balance-settings__row', key: provider },
                React.createElement('span', null, provider, data.custom[provider].vendor ? (chinese ? '（' + data.custom[provider].vendor + '）' : ' (' + data.custom[provider].vendor + ')') : ''),
                React.createElement('button', { className: 'dsh-model-balance-settings__del', type: 'button', onClick: function () { remove(provider) } }, text('Delete', '删除'))
              )
            })
        ),
        React.createElement('div', { className: 'dsh-model-balance-settings__form' },
          React.createElement('div', { className: 'dsh-model-balance-settings__field' },
            React.createElement('label', { className: 'dsh-model-balance-settings__label' }, text('Provider id (for example, openai or my-proxy)', 'provider id（如 openai / my-proxy）')),
            React.createElement('input', { className: 'dsh-model-balance-settings__input', value: form.provider, onChange: function (e) { setForm(Object.assign({}, form, { provider: e.target.value })) }, placeholder: 'e.g. openai' })
          ),
          React.createElement('div', { className: 'dsh-model-balance-settings__field' },
            React.createElement('label', { className: 'dsh-model-balance-settings__label' }, text('Balance endpoint URL (full URL)', '余额接口 URL（完整地址）')),
            React.createElement('input', { className: 'dsh-model-balance-settings__input', value: form.url, onChange: function (e) { setForm(Object.assign({}, form, { url: e.target.value })) }, placeholder: 'https://api.example.com/v1/dashboard/billing/credit_grants' })
          ),
          React.createElement('div', { className: 'dsh-model-balance-settings__field' },
            React.createElement('label', { className: 'dsh-model-balance-settings__label' }, text('Response field path (supports data.x and arr[0].y)', '响应字段路径（支持 data.x 与 arr[0].y）')),
            React.createElement('input', { className: 'dsh-model-balance-settings__input', value: form.path, onChange: function (e) { setForm(Object.assign({}, form, { path: e.target.value })) }, placeholder: 'e.g. data.available_balance' })
          ),
          React.createElement('div', { className: 'dsh-model-balance-settings__field' },
            React.createElement('label', { className: 'dsh-model-balance-settings__label' }, text('Authentication', '鉴权方式')),
            React.createElement('select', { className: 'dsh-model-balance-settings__input', value: form.auth, onChange: function (e) { setForm(Object.assign({}, form, { auth: e.target.value })) } },
              React.createElement('option', { value: 'bearer' }, 'Bearer Token'),
              React.createElement('option', { value: 'raw' }, text('Raw key (for example, Zhipu)', '裸 Key（如智谱）'))
            )
          ),
          React.createElement('div', { className: 'dsh-model-balance-settings__field' },
            React.createElement('label', { className: 'dsh-model-balance-settings__label' }, text('Display name (optional)', '显示名称（可选）')),
            React.createElement('input', { className: 'dsh-model-balance-settings__input', value: form.vendor, onChange: function (e) { setForm(Object.assign({}, form, { vendor: e.target.value })) }, placeholder: 'e.g. My relay' })
          ),
          React.createElement('div', { className: 'dsh-model-balance-settings__actions' },
            React.createElement('button', { className: 'dsh-model-balance-settings__btn', type: 'button', onClick: save }, text('Save', '保存')),
            notice ? React.createElement('span', { className: 'dsh-model-balance-settings__hint' }, notice) : null
          )
        )
      )
    }

    exports.name = 'model-balance'
    exports.inject = ['slots']
    exports.apply = function (ctx) {
      var removeStyle = injectStyle()
      var slots = ctx.slots
      var disposers = [
        removeStyle,
        slots.inject('conversation.input.right', function () {
          return slots.register(
            { name: 'conversation.input.right', id: 'model-balance', order: -10, label: text('Balance', '余额') },
            function () { return React.createElement(BalanceInputButton, null) }
          )
        }),
        slots.inject('settings.section', function () {
          return slots.register(
            { name: 'settings.section', id: 'model-balance', order: 58, label: text('Balance lookup', '余额查询') },
            function () { return React.createElement(BalanceSettingsPage, null) }
          )
        })
      ]
      return function () {
        disposers.forEach(function (dispose) { if (typeof dispose === 'function') dispose() })
      }
    }

    return module.exports
  }
})
