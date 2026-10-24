# 上传到 GitHub —— ✅ 已完成

**仓库：https://github.com/moonskycake/venera-next**
（`main` 分支已推送，4 个文件齐全）

## 现成直链（已验证 200，内容与本地一致）

```
# 单个源（Venera：漫画源 → 添加来源 → 粘贴 URL）
https://cdn.jsdelivr.net/gh/moonskycake/venera-next@main/copy_manga.js

# 整套源仓库（Venera：漫画源 → 源管理 → 添加仓库）
https://cdn.jsdelivr.net/gh/moonskycake/venera-next@main/index.json

# 备用（jsDelivr 不通时用，国内通常需要代理）
https://raw.githubusercontent.com/moonskycake/venera-next/main/copy_manga.js
```

更新后再跑一次：

```bash
cd "E:/codes/venera-app_调试/拷贝漫画修复版/github仓库"
git add -A && git commit -m "update copy_manga"
git -c http.proxy=http://127.0.0.1:10808 push
# 然后刷新 jsDelivr 缓存：
# https://purge.jsdelivr.net/gh/moonskycake/venera-next@main/copy_manga.js
```

---

<details>
<summary>最初的推送步骤（留档）</summary>


`github仓库/` 里已经 `git init` + 首次提交完成，包含：

```
README.md        源仓库介绍（含订阅方式）
index.json       源仓库清单
copy_manga.js    拷贝漫画源修复版
.gitattributes   强制 LF，避免 CRLF 影响脚本
```

我这边没有 `gh` CLI、也没有你的 GitHub 凭据，**最后一步 push 需要你执行**（两条路选一条）。

---

## 路线 A：网页上传（最简单，不用碰 git）

1. GitHub → New repository
   - Repository name：随意，例如 `venera-sources`
   - **Public**（jsDelivr 只能代理 public 仓库）
   - 不要勾 Add README / .gitignore / license（避免和已有文件冲突）
2. 仓库页 → **uploading an existing file** → 把这 4 个文件拖进去 → Commit changes
3. 完成。直链（把 `<user>` `<repo>` 换成你的）：

```
# 单个源（Venera：添加来源 → 粘贴 URL）
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/copy_manga.js

# 整套源仓库（Venera：源管理 → 添加仓库）
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/index.json

# 备选（jsDelivr 不通时用 raw，国内可能需要代理）
https://raw.githubusercontent.com/<user>/<repo>/main/copy_manga.js
```

## 路线 B：命令行 push

```bash
cd "E:/codes/venera-app_调试/拷贝漫画修复版/github仓库"

# 先在网页上建好空仓库，然后：
git remote add origin https://github.com/<user>/<repo>.git

# 你机器上 GitHub 直连不通，push 时挂上本地代理（10808）：
git -c http.proxy=http://127.0.0.1:10808 push -u origin main
```

推送时会弹窗要求认证：用 **Personal Access Token**（Settings → Developer settings → Personal access tokens → Fine-grained/Classic，勾 `repo` 权限）当密码，
或让 Git Credential Manager 走浏览器登录。系统里 `credential.helper=manager`，成功一次后会记住，以后不用再输。

---

## 之后要注意

**jsDelivr 有缓存**：改了 `copy_manga.js` 后要刷新缓存，否则 App 拉到的还是旧版：

```
https://purge.jsdelivr.net/gh/<user>/<repo>@main/copy_manga.js
```

或者干脆用 `@<commit sha>` 代替 `@main`（每次更新换 sha，绝对不吃缓存）。

**App 里怎么用（两种）**

1. 单源：漫画源 → 添加来源 → 粘贴 `copy_manga.js` 的直链 → 识别并预览 → 安装（key 已存在会提示重新加载）
2. 源仓库：漫画源 → 源管理 → 添加仓库 → 填 `index.json` 直链 → 以后可在源管理里检查更新

**风险提醒**：仓库是 public 的，拷贝漫画这类源在实名平台上可能被举报后删库；真要长期用，建议同时留一份本地文件/自建托管，别只依赖 GitHub。

</details>
