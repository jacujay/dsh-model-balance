# dsh-model-balance

自动识别当前模型厂商，在输入框内直接显示**余额 / 配额**——模型名称左侧一个小按钮，悬停查看、点击刷新。没有公开余额接口的厂商，可在设置页添加自定义接口兜底。

为 [DeepSeek Harness](https://www.deepseek.com/harness/)（DSH web）而生。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 特性

- **自动识别厂商**——从 DSH 配置读取当前默认模型的 provider，先按 provider id 匹配、再按 baseURL 域名兜底；自定义 id（如 `minimax-cn`）也能命中。
- **内置厂商**——DeepSeek、Moonshot/Kimi、MiniMax、阶跃星辰、智谱（仅配额）、硅基流动、OpenRouter。
- **两类结果**——金额余额（接口提供时含现金/赠金明细）与配额（MiniMax / 智谱只给用量计划，不给钱）。
- **输入框按钮**——原生输入行里、模型名称左侧的小 `◈` 图标。悬停弹出浮层，点击刷新；错误 / 无接口 / 配额态各有颜色。
- **设置页**——设置 → **余额查询**：列出内置厂商，并可为任意 provider 添加自定义余额接口（URL + 响应字段路径 + Bearer/裸 Key 鉴权 + 显示名）。
- **Key 安全**——API Key 全程在 Host 侧通过 DSH 凭据库解析，绝不到达浏览器；自定义接口配置持久化到 `~/.dsh/dsh-model-balance.json`，**不含任何密钥**。
- **秒级生效**——Host 通过同源 HTTP 路由应答，刷新页面即用，无需重启。

## 安装

需要 DSH web。可从插件市场安装，或：

```sh
# 从 GitHub 安装
dsh plugin --profile web add github:jacujay/dsh-model-balance
```

然后刷新浏览器页面。

## 内置厂商

| 厂商 | 接口 | 类型 |
| --- | --- | --- |
| DeepSeek | `/user/balance` | 余额（CNY） |
| Moonshot / Kimi | `/v1/users/me/balance` | 余额 |
| MiniMax | `/v1/token_plan/remains` | 配额（按模型 %） |
| 阶跃星辰 | `/v1/accounts` | 余额 |
| 智谱 GLM | `/api/monitor/usage/quota/limit` | 仅配额 |
| 硅基流动 | `/v1/user/info` | 余额 |
| OpenRouter | `/api/v1/auth/key` | 余额（USD）/ 无限 |

### New API 兼容中转站

New API 的 Token 用量接口是 `/api/usage/token`，使用和模型调用相同的 API Key，不需要数字用户 ID 或单独的 Access Token。在 **设置 → 余额查询** 添加自定义接口：

- URL：`https://你的中转站.example.com/api/usage/token`
- 响应字段路径：`data.total_available`
- 鉴权方式：`Bearer Token`
- 显示名称：可选

插件会自动识别 New API 的 `token_usage` 响应；`unlimited_quota` 为 true 时显示无限额度，否则显示剩余额度、总额度和已用额度。

其它厂商：在 **设置 → 余额查询** 添加自定义接口。API Key 仍来自 DSH 凭据（provider 的 `apiKeyEnv`），自定义 URL 由 Host 侧携带调用。

## 隐私与安全说明

- 余额请求由**本地 DSH Host** 携带厂商 API Key 发出；Key 不离开本机、不进浏览器。
- 设置页只保存接口元数据（`~/.dsh/dsh-model-balance.json`），不含密钥。
- Host 路由挂在 DSH web 服务器上，同源 HTTP；写操作（保存/删除自定义接口）带同源校验。
- 自定义接口 URL 由用户提供、可能指向任意地址，保存前请自行确认。

## 开发

```sh
# 无构建步骤——Host 是纯 ESM（lib/index.js），Client 是手写 __ModuleLoader__ bundle（client/client.js）
node --check lib/index.js
node --check client/client.js
```

## 许可证

MIT
