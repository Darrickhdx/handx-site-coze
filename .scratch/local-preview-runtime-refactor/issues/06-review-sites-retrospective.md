# 06 — 双轴审查、Sites 本地验收与方法论复盘

**What to build:** 对完整改造分别执行 Standards 与 Spec 审查，闭环发现；使用 Sites 的既有网站 capability path 完成本地构建和预览交接，填写 90 分记分卡，并交付可用于新项目的 skills 指南。

**Blocked by:** 05 — 生产入口切换与旧实现收缩。

**Status:** completed

- [x] Standards 与 Spec 两个审查轴分别完成并保留证据。
- [x] 所有阻断问题均修复并重新验证。
- [x] Sites 本地构建和预览交接完成，禁止部署门禁未被绕过。
- [x] 记分卡达到至少 90/100，所有硬门禁通过。
- [x] 复盘说明每个 skill 的实际作用、改进、局限和推荐使用时机。
- [x] 新项目采用指南包含最小技能组合、触发顺序和停止门禁。

## Delivery evidence

- 双轴审查：`docs/reviews/local-preview-runtime-dual-axis-review.md`
- 实验复盘：`docs/experiments/matt-pocock-skills-pilot-retrospective.md`
- 新项目指南：`docs/guides/matt-pocock-skills-new-project-guide.md`
- 记分卡：95/100，所有硬门禁通过。
- Sites 本地 capability path：保留现有 pnpm/Next 架构，`pnpm build` 与 `pnpm smoke:local` 通过；`.openai/hosting.json` 不存在，且项目门禁禁止创建 Sites 项目或公网部署。
