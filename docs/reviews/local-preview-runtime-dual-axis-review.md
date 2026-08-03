# 本地预览运行层双轴审查

审查固定点：`0d4362e`  
初审范围：`git diff 0d4362e...04ba644`

## Standards Review

结论：**0 个硬违规，4 个判断性提醒。**

未发现违反 `AGENTS.md` 的 pnpm-only、TypeScript strict 心智、禁用 `any`、动态路径或未使用项规则。

判断性提醒：

1. `src/server/local-interactions.ts` 的多个 JSON POST 路由重复方法、同源、Content-Type、大小与 JSON 错误检查，属于可能的 Duplicated Code。
2. 初版图谱刷新修复在节点/边分支之间存在 Duplicated Code / Data Clumps。
3. 图谱计数曾在验证器与 smoke 中重复，属于 Shotgun Surgery / Duplicated Code。
4. HTTP 测试的服务器与临时目录脚手架重复。

处置：

- 第 2 项随越界图谱刷新提交整体撤销。
- 第 3 项已由 `tools/graph_wiki_contract.py` 建立单一计数与漂移合同。
- 第 1 项暂不抽取：现有错误检查顺序属于冻结 HTTP 合同，当前重复是显式局部性；在没有逐路由错误顺序参数化测试前，抽取的回归风险大于收益。
- 第 4 项为非阻断技术债；测试仍全部通过真实回环 HTTP 观察行为。后续新增第 10 个合同时再提取 fixture，避免为一次实验扩大改动。

## Spec Review

初审结论：**2 个阻断项，1 个非阻断项。**

1. 阻断：`60133d3` 把 Legacy 客户端数据从 107/151/258 刷新为 133/201/334，违反“不修改公开内容”和“不改变研究节点/关系边界”。
2. 阻断：复盘、采用指南、Sites 本地交接与记分卡尚未完成。
3. 非阻断：部分 HTTP 测试通过私密运行目录设置损坏日志、语料索引与管理员令牌，仍知道内部文件名。

处置：

- `61bcafb` 完整撤销第 1 项的公开数据刷新；`git diff 0d4362e...HEAD -- public/data` 为空。
- `b9c70a2` 首先冻结已批准 107/151/258 投影；2026-08-04 又将隔离审计扩展为 10 项既有记录变化、26 个新增节点和 50 条新增边，共 86 条无语义指纹记录。任何删除、重排、身份字段或边端点改变均拒绝构建。
- 第 2 项由本实验复盘、采用指南、记分卡和第 6 票闭环。
- 第 3 项接受为非阻断测试夹具例外：HTTP 状态、响应体和可见性均从真实 HTTP 观察；只有无法通过公开 API 构造的损坏日志、站主令牌和本机语料索引由真实临时文件系统注入。没有为测试增加生产 seam。

## 闭环结论

- 第一次修复后的 Standards 复审又发现 1 个控制流阻断：Legacy 隔离分支成功返回时也跳过了独立的 audited graph 更新。最终实现把审计投影构建提取为共享函数；隔离时只冻结 Legacy 两个输出，audited graph 与 manifest 仍正常刷新。
- 2026-08-04 后，`ALLOW_LEGACY_GRAPH_REFRESH=1`被明确降为无授权能力的旧开关，单独设置会直接失败；Legacy 候选必须先进入审计主张并逐项完成人工发布审查。误导性的 `assess_append_only_legacy_drift` 已改名为 `assess_quarantinable_legacy_drift` 并明确可隔离字段。
- Standards：0 个未解决硬问题；4 个已消除或接受的非阻断判断项。
- Spec：2 个阻断项均已修复；1 个非阻断 seam 限制有明确边界。
- 完整 `validate`、`build`、`smoke:local` 均通过；公开部署仍关闭。
