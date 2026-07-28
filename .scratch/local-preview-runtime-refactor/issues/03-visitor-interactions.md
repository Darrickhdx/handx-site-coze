# 03 — 访客互动迁移

**What to build:** 通过本地预览运行层完整提供统计、私密留言和公开评论投稿/读取，保持现有来源校验、限流、隐私、XSS 和先审后显行为。

**Blocked by:** 01 — HTTP 合同测试与运行层骨架。

**Status:** implemented-pending-cutover

- [x] 统计事件保持字段白名单、会话哈希、路径清洗和容量限制。
- [x] 私密留言保持 honeypot、同源、同意、限流和 pending 状态。
- [x] 评论保持章节隔离、重复拒绝、链接限制、XSS 转义和先审后显。
- [x] 损坏审核日志时公开评论 fail closed。
- [x] HTTP 合同及错误检查顺序保持不变。

## TDD evidence

- Red: 新增真实 HTTP 合同首次运行得到访客统计/留言 404、评论 fallback 非 JSON，证明新运行层尚未接管。
- Green: `pnpm test:local-runtime` 通过 9/9；观察到统计会话哈希与路径去查询、留言同源/honeypot/pending、评论去重/链接限制/章节隔离/XSS 转义/先审后显及损坏日志 503 fail closed。
- Verification: TypeScript 与新增模块、合同测试的 ESLint 通过；容量和限流的既有全量反向检查留待票 05 的生产入口 smoke。
