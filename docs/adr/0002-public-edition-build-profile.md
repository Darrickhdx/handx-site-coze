# 公开发行版以物理暂存树分离，而不是路由门禁

本项目决定用一棵生成的暂存树（`tools/stage-public-edition.mjs` → `.edition/public/`）产出公开发行版：按 `src/data/public-edition-manifest.json` 的白名单，从 `src/app` 复制允许的路由，再用 `src/app-public/` 覆盖，`next build` 以该暂存树为根运行。代价是多一个构建步骤和一棵生成目录，换来的是"公开产物里零字节可追溯到未授权来源"这一条可被字节扫描证明的性质。

## 为什么不用运行时门禁

在共享的 `src/app` 里给 `/wiki`、`/graph`、`/legacy`、`/studio` 等路由的 layout 加 `notFound()` 是更小的改动，但它挡不住数据泄漏。这些路由静态 import `@/lib/graph-wiki-data`，后者静态 import `public/data/graph/audit-graph.json`（131 来源、211 主张）。运行时 guard 只是不渲染，模块**照样被编译进 `.next/server/`**。同样的反对意见适用于路由组和条件式 `page.tsx`：它们决定什么被路由，不决定什么被编译。

白名单之外的东西根本不被复制到暂存树，编译器看不见它们。这不是"更安全一点"，是把一个运行时承诺换成了一个可以在构建产物上验证的事实。

## 与工作台合同的关系

`must_not_deploy: true` 与 `deployment_authorized: false` 在研究数据文件里**永不翻转**。公开版不复用它们，而是持有自己的、同样 fail-closed 的授权合同（`public-edition-manifest.json` + `tools/verify-public-edition.mjs`）。该校验器的职责之一是反向断言：逐个重读工作台的 `must_not_deploy` 文件，确认它们仍然关着。公开合同因此不是绕开工作台合同的口子，而是它的看守。

`requireLocalPreviewStartup`（`src/server/local-preview-runtime.ts`）不被修改、不被 import、不被泛化——它继续是工作台的唯一权威。公开版另有 `requirePublicEditionStartup`。两者的对称性是这套设计的要点：

> 工作台拒绝在回环之外运行；公开服务器拒绝在研究数据旁边运行。两者都 fail-closed，方向相反。

## 对 ADR 0001 的影响

ADR 0001 规定本机互动由单一 Node 请求处理器承担，工作台因此没有任何 `src/app/api` 路由。该性质此前只是约定，现由 `tools/verify-security-boundaries.ts` 断言为构建期不变量。公开版需要真正的 route handler（`/go/[code]`、评论、留言、统计），它们放在 `src/app-public/api/**`，只在暂存时进入 `.edition/public/src/app/api/**`。`src/app` 永远不长出 `api` 目录，ADR 0001 在工作台内保持完整。

## 现状

本 ADR 记录已确定的方向。`src/lib/edition.ts`（`SITE_EDITION` 解析，缺省即 workbench）与上述 `src/app/api` 不变量已落地；暂存器、manifest 与公开校验器尚未实现。在它们完成之前，本仓库只能构建工作台版。
