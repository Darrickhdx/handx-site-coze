# 02 — 研究投影迁移

**What to build:** 让四个研究投影通过本地预览运行层提供，并保持批准代次、GET/HEAD、响应头、固定字节及错误方法 fallback 的现有行为。

**Blocked by:** 01 — HTTP 合同测试与运行层骨架。

**Status:** ready-for-agent

- [ ] 四个研究投影的 GET 返回现有字节和代次响应头。
- [ ] HEAD 与 GET 的状态及 Content-Length 一致，但不返回正文。
- [ ] 非 GET/HEAD 请求继续交给 fallback。
- [ ] 混合代次、编译/运行不一致和发布门禁开启时拒绝创建运行层。
- [ ] 研究投影仍为只读呈现，不创建新事实。
