# 01 — HTTP 合同测试与运行层骨架

**What to build:** 建立可通过真实回环 HTTP 验证的本地预览运行层骨架；未识别请求准确交给 fallback，所有响应保持站点级安全头，并留下第一组可复现的 red → green 证据。

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] HTTP 合同测试通过实际临时端口观察行为，不测试内部函数调用。
- [x] 第一个测试先因运行层尚不存在而失败，再由最小实现变绿。
- [x] 工厂返回完整 Node HTTP 请求处理器。
- [x] fallback 只调用一次，错误由运行层安全兜底。
- [x] 相关测试、类型检查和既有验证保持通过。

## TDD evidence

- Red: `pnpm test:local-runtime` 因 `../../src/server/local-preview-runtime` 尚不存在而退出 1。
- Green: `pnpm test:local-runtime` 通过 2/2 个真实回环 HTTP 测试。
- Verification: 新增测试、TypeScript、全仓 ESLint、Stylelint、小说/媒体/版权/本地门禁/发布边界均通过；全量 `pnpm validate` 另被仓库外上游 `苏开元知识图谱-交互版.html` 的摘要漂移阻断，留到最终门禁阶段单独审计，不归因于本票。
