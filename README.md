# dsh-model-balance

Auto-detect the current model vendor and show its **balance / quota** right in the composer input row — a small button left of the model name, hover to peek, click to refresh. A settings page covers vendors without a public balance endpoint via custom endpoints.

Built for [DeepSeek Harness](https://www.deepseek.com/harness/) (DSH web).

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Features

- **Auto vendor detection** — reads the current default model's provider from DSH configuration and identifies the vendor by provider id, then by baseURL hostname as a fallback. Custom provider ids (e.g. `minimax-cn`) still match.
- **Built-in vendors** — DeepSeek, Moonshot/Kimi, MiniMax, StepFun, Zhipu (quota only), SiliconFlow, OpenRouter.
- **Two result kinds** — monetary balance (with granted/topped-up breakdown where the API provides it) and quota (MiniMax / Zhipu, which expose usage plans instead of money).
- **Input-row button** — a small `◈` icon before the model name in the native composer row. Hover opens a peek panel; click refreshes. Error / unsupported / quota states get their own colors.
- **Settings page** — Settings → **余额查询**: lists supported vendors and lets you add a custom balance endpoint for any provider (URL + response field path + bearer/raw auth + display name).
- **Key-safe** — API keys are resolved host-side through the DSH credentials store and never reach the browser. Custom endpoint config persists at `~/.dsh/dsh-model-balance.json` **without** any secrets.
- **Live in seconds** — the host answers over same-origin HTTP routes; no restart needed after a page refresh.

## Install

Requires DSH web. From the plugin market or:

```sh
# from GitHub
dsh plugin --profile web add github:jacujay/dsh-model-balance
```

Then refresh the browser page.

## Supported vendors

| Vendor | Endpoint | Kind |
| --- | --- | --- |
| DeepSeek | `/user/balance` | balance (CNY) |
| Moonshot / Kimi | `/v1/users/me/balance` | balance |
| MiniMax | `/v1/token_plan/remains` | quota (per-model %) |
| StepFun | `/v1/accounts` | balance |
| Zhipu GLM | `/api/monitor/usage/quota/limit` | quota only |
| SiliconFlow | `/v1/user/info` | balance |
| OpenRouter | `/api/v1/auth/key` | balance (USD) / unlimited |

Anything else: add a custom endpoint in **Settings → 余额查询**. The API key still comes from DSH credentials (`apiKeyEnv` of the provider), the custom URL is called host-side with it.

## Privacy & security notes

- Balance requests are issued by the **local DSH host** with the provider's API key; the key never leaves this machine and never enters the browser.
- The settings page stores only endpoint metadata (`~/.dsh/dsh-model-balance.json`), no secrets.
- The host routes are same-origin HTTP on the existing DSH web server; mutating routes (custom endpoint save/delete) carry a same-origin check.
- Custom endpoint URLs are user-provided and may point anywhere; review them before saving.

## Development

```sh
# no build step — host is plain ESM (lib/index.js), client is a plain
# __ModuleLoader__ bundle (client/client.js)
node --check lib/index.js
node --check client/client.js
```

## License

MIT
