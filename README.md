# Venera 漫画源（自建收藏）

个人维护的 [Venera / Venera-Next](https://github.com/CyrilPeng/venera-next) 漫画源集合。

| 源 | key | 版本 | 说明 |
|---|---|---|---|
| 拷贝漫画 | `copy_manga` | 1.4.4-debug1 | 读图改走网页解密，绕开 210 风控 |
| 包子漫画 | `baozi` | 1.1.7-debug1 | 换可用域名 + 新章节寻址 + 网页阅读页 |
| 漫蛙吧 | `manwaba` | 1.0.6-debug1 | 接口域名换 manwaxu.cc + 分页抓全 + 图片 AES 解密（正文+封面） |
| Komiic | `Komiic` | 1.0.4-debug1 | 域名换 komiic.cc，封面改写 public.komiic.cc |
| 漫画1234 | `mh1234` | 1.0.1-debug1 | 站点已关闭，改为给出明确提示而不是崩溃 |

三个源都实测**不需要代理**。

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
| `copy_manga.js` | 拷贝漫画源 |
| `baozi.js` | 包子漫画源 |
| `manwaba.js` | 漫蛙吧源 |

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

## 包子漫画 / 漫蛙吧改动要点

**包子漫画**：默认域名 `cn.bzmgcn.com` 现在整站 403（gatekeeper 人机验证），换到 `twmanga.com` 等可用域名；
`appcn.baozimh.com` 阅读接口被 Cloudflare 拦，改走网页阅读页 `/user/page_direct?comic_id=..&section_slot=..&chapter_slot=..`；
章节从"序号"改为 `section_slot_chapter_slot` 寻址，并缓存真实 `comic_id`。

**漫蛙吧**：接口域名 `mwuu.cc` 已停用（301 → `manwaxu.cc`）；
读图接口只认 snake_case `page_size` 且上限 100，原实现 209 张的章节只拿到 100 张，改为分页抓全；
**图片是 AES-256-CBC 加密的**（前 16 字节 IV，密钥在官方 `base.js` 的 `BaseUtil.AES_KEY`），
用 `onImageLoad.onResponse` 在本地解密，否则 App 报 `invalid image data`；
封面域名 `svip.mwtuwu.cc`（单 IP，大陆常打不开）改写到 Cloudflare 的 `tu.mhttu.cc`。

**Komiic**：`komiic.com` 在国内直连被 TLS 重置（`Connection reset by peer`），改用同服务的 `komiic.cc`；
封面来自 `public.komiic.com`（同样被重置），改写为 `public.komiic.cc` 并补 `onThumbnailLoad`。

**漫画1234**：站点已于 2026-08 关闭（域名变停放页），源保留但会在搜索/首页给出明确提示，
不再抛 `cannot read property 'attributes' of null`。

## 说明

- 所有内容版权归原站与作者所有，本仓库仅包含用于客户端的接口适配脚本，不含任何漫画内容。
- 脚本随时可能因站点改版失效；失效请提 issue。
