# 05 — 生产入口切换与旧实现收缩

**What to build:** 让实际本地网站只通过新的本地预览运行层处理运行请求，删除服务组合根中的旧实现，并证明页面、运行接口、研究投影和启动门禁全部保持。

**Blocked by:** 02 — 研究投影迁移；03 — 访客互动迁移；04 — 站主操作迁移。

**Status:** completed

- [x] 服务组合根只保留配置、Next.js 准备、运行层创建和监听生命周期。
- [x] 旧路由分派和重复实现已删除，没有双写或双处理路径。
- [x] 完整 validate、build 和 smoke:local 通过。
- [x] 禁止部署、回环监听、私密权限和混合代次反向测试通过。
- [x] 变更保持规格规定的全部外部合同。

## Verification evidence

- Characterization: 切换前新运行层 9/9 真实 HTTP 合同为绿；本票是行为保持重构，不制造无意义的新功能红灯。
- Production build: `pnpm build` 通过 Next.js 558 个静态页面生成和 `dist/server.js` 打包。
- Full smoke: `pnpm smoke:local` 通过 34 页面、4 研究投影、8 运行接口、182 原尺寸与 182 响应式小说页，以及部署/权限/代次反向门禁。
- Full validation: `pnpm validate` 通过数据、图谱、小说、媒体、版权、发布边界、9 个运行层合同、TypeScript、ESLint 与 Stylelint。
- Upstream drift: 构建时发现 2 个既有 Legacy 节点变化以及 26 个新节点、50 条新边；越界刷新提交已撤销，最终构建冻结原批准 107/151/258 投影并把这些变化隔离到人工交叉映射门禁之外。
