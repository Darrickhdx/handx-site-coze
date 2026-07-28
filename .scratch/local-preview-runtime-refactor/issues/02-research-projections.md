# 02 — 研究投影迁移

**What to build:** 让四个研究投影通过本地预览运行层提供，并保持批准代次、GET/HEAD、响应头、固定字节及错误方法 fallback 的现有行为。

**Blocked by:** 01 — HTTP 合同测试与运行层骨架。

**Status:** completed

- [x] 四个研究投影的 GET 返回现有字节和代次响应头。
- [x] HEAD 与 GET 的状态及 Content-Length 一致，但不返回正文。
- [x] 非 GET/HEAD 请求继续交给 fallback。
- [x] 混合代次、编译/运行不一致和发布门禁开启时拒绝创建运行层。
- [x] 研究投影仍为只读呈现，不创建新事实。

## TDD evidence

- Red: `pnpm test:local-runtime` 为新增合同得到 3 个预期失败：投影落入 fallback、非回环/PROD 未拒绝、快照门禁未拒绝。
- Green: 同一命令通过 6/6；四份固定字节、GET/HEAD、代次/摘要头、错误方法 fallback 和三类快照门禁均由真实 HTTP 或创建时观察验证。
- Verification: `pnpm ts-check` 与新增运行层、合同测试的 ESLint 均通过。
