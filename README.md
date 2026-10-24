# Venera 漫画源（自建收藏）

个人维护的 [Venera / Venera-Next](https://github.com/CyrilPeng/venera-next) 漫画源集合。
目前收录：**拷贝漫画（copy_manga）** 修复版。

## 订阅为源仓库（一次添加，后续可检查更新）

在 App 里：**漫画源 → 源管理 → 添加仓库**，填入本仓库 `index.json` 的直链：

```
https://cdn.jsdelivr.net/gh/<你的用户名>/<仓库名>@main/index.json
或
https://raw.githubusercontent.com/<你的用户名>/<仓库名>/main/index.json
```

## 直接导入单个源

**漫画源 → 添加来源 → 粘贴 URL**：

```
https://cdn.jsdelivr.net/gh/<你的用户名>/<仓库名>@main/copy_manga.js
```

## 文件

| 文件 | 说明 |
|---|---|
| `index.json` | 源仓库清单（`[{name, fileName, key, version}]`） |
| `copy_manga.js` | 拷贝漫画源，`key = copy_manga`，`version = 1.4.4-debug1` |

## 拷贝漫画源改动要点

原版（venera-configs@main 1.4.3）在当前站点已无法阅读：

1. 默认 API `api.copy2000.online` 的内容接口返回 `{"code":200,"results":null}`（静默空数据）
2. 旧客户端指纹被判定为修改版，`chapter2` 触发 210 风控
3. 官方 App（hotmangas 3.0.0）的内容接口已要求登录 token

修复方式：

- 默认线路改 `api.copy5000.com`，并做多线路轮换 + 记住可用线路
- 内容接口统一重试（210 / 空数据 / 连接失败），等待上限 15s
- **读图改走网页版**：解析章页里的 `cct` + `contentKey`，AES-128-CBC 本地解密得到图片列表
- 图片请求统一带 `UA: COPY/3.0.6`（venera-configs#232 的 UA 问题）
- 删除会把 `base_url` 覆盖成不可达 `t66y.com` 的 `refreshAppApi()`

实测（2026-10）：`loadEp` 1.6~2.4s、单话 8~209 张图、图片直连与代理均 200。

## 说明

- 所有内容版权归原站与作者所有，本仓库仅包含用于客户端的接口适配脚本，不含任何漫画内容。
- 脚本随时可能因站点改版失效；失效请提 issue。
