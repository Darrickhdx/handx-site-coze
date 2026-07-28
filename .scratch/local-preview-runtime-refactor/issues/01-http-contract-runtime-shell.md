# 01 — HTTP 合同测试与运行层骨架

**What to build:** 建立可通过真实回环 HTTP 验证的本地预览运行层骨架；未识别请求准确交给 fallback，所有响应保持站点级安全头，并留下第一组可复现的 red → green 证据。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] HTTP 合同测试通过实际临时端口观察行为，不测试内部函数调用。
- [ ] 第一个测试先因运行层尚不存在而失败，再由最小实现变绿。
- [ ] 工厂返回完整 Node HTTP 请求处理器。
- [ ] fallback 只调用一次，错误由运行层安全兜底。
- [ ] 相关测试、类型检查和既有验证保持通过。
