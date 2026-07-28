# Matt Pocock skills 实验记分卡

通过门槛：总分至少 **90/100**，并且所有硬门禁均通过。

## 硬门禁

- [x] 不改变现有网站 URL、公开内容和 HTTP 合同。
- [x] 不泄漏管理员令牌、联系人、私密正文、绝对路径或未批准研究内容。
- [x] 保持 `deployment_authorized=false` 与 `must_not_deploy=true`，不创建公网部署。
- [x] 完整验证、生产构建和全站 HTTP 冒烟全部通过。
- [x] 双轴审查不存在未解决的阻断级问题。

任一硬门禁失败时，不论分数多少，实验均不通过。

## 评分

| 项目 | 分值 | 得分 | 权威证据 |
|---|---:|---:|---|
| 八个本地运行接口行为保持 | 10 | 10 | 9 个真实 HTTP 合同；smoke 报告 `local_runtime_endpoints: 8` |
| 四个研究投影、GET/HEAD 与代次绑定保持 | 10 | 10 | 固定字节、HEAD、代次/摘要头合同；混合代次反向门禁 |
| Origin、令牌、限流、安全响应头保持 | 10 | 10 | 合同测试与完整 smoke |
| 私密权限、评论审核与 fail-closed 保持 | 10 | 10 | 临时私密目录、审核生命周期与损坏日志 503 |
| 非回环、生产环境和混合代次启动拒绝保持 | 10 | 10 | 工厂与真实进程反向测试 |
| 单入口深模块与清晰 composition root | 10 | 10 | `src/server.ts` 35 行；唯一 RequestListener 工厂 |
| TDD 留下可复现的 red → green 证据 | 10 | 5 | 票 01/02/03/04 有红绿证据；03/04 曾批量写测试且部分夹具知道内部文件名 |
| 完整 validate、build、smoke 通过 | 10 | 10 | 2026-07-29 当前三项均 PASS |
| Standards 与 Spec 双轴审查完成并闭环 | 10 | 10 | `docs/reviews/local-preview-runtime-dual-axis-review.md` |
| Sites 本地验证、skills 复盘和新项目指南完成 | 10 | 10 | build/smoke；复盘与指南文档；hosting 因禁止部署门禁停止 |

## 最终结果

**95/100 — PASS。**

- 公开数据相对实现固定点无差异：`git diff 0d4362e...HEAD -- public/data` 为空。
- 上游 Legacy 漂移被识别但未进入客户端：2 个既有节点变化、26 个新节点、50 条新边处于隔离状态。
- 没有创建 Sites 项目或公网部署；这是经 Sites capability path 验证过的本地交付。

## 评分规则

- 10 分：要求完整实现，并有直接、当前、可复现证据。
- 5 分：部分实现或证据只覆盖部分范围。
- 0 分：未实现、验证失败或缺少权威证据。
- 不使用“看起来正确”“测试未发现问题”代替直接证据。
