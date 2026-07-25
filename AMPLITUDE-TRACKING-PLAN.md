# 鉴真小秃驴个人网站｜第一方分析与 Amplitude 迁移计划

更新：2026-07-24

## 当前真实状态

本地审阅版已经接通**纯本机、第一方**的最小统计层：

- 页面切换发送 `page_view`；
- 文章在前台达到约 20 秒且读到约 40% 时发送一次 `reading_engaged`；
- 文章在前台达到约 45 秒且到达文末时发送一次 `reading_completed`；
- 点击带 `data-amplitude-event` 的入口时，发送显式事件；
- 成功保存私密留言后发送 `private_message_submitted`；
- 数据只写入忽略版本管理的 `private-runtime/analytics-events.ndjson`；
- 分析与留言各有全局和标签会话两层内存限流，单个日志文件达到 25 MiB 后停止追加，不自动删除旧数据；
- 服务端只保存页面 pathname、事件名、严格白名单属性、时间和加盐后的会话哈希；
- 来源仅保存低基数预设类别与预先登记的活动编号；不保存完整 referrer、来源网页路径或自由文本 UTM；
- 不保存 IP、原始 User-Agent、完整 URL/query、搜索词、Cookie、邮箱、微信号、精确滚动轨迹或留言正文；
- 浏览器开启 DNT 或 GPC 时，客户端统计不发送；
- `/insights` 只在当前 loopback 本地站查看。

当前仍然**没有初始化 Amplitude SDK，也不向 Amplitude 或其他第三方发送数据**。已连接的 Amplitude 默认项目此前显示 0 个事件，不能据此报告访问量、点击率、转化或留存。

## 当前事件合同

全局事件：

- `page_view`
- `reading_engaged`
- `reading_completed`
- `contact_started`
- `private_message_submitted`

个人信任与首页：

- `home_profile_opened`
- `home_sukaiyuan_opened`
- `home_featured_story_opened`
- `first_visit_step_opened`
- `home_section_opened`
- `knowledge_node_opened`
- `hero_document_opened`
- `article_author_opened`
- `article_attribution_copied`
- `article_source_credit_opened`

苏开元深读：

- `story_started`
- `hero_evidence_opened`
- `historical_context_opened`
- `fragment_timeline_opened`
- `methodology_opened`
- `research_participation_opened`
- `person_archive_opened`
- `evidence_archive_opened`
- `open_questions_opened`
- `featured_story_opened`

全站导航：

- `master_navigation_opened`
- `mobile_master_navigation_opened`
- `header_research_archive_opened`
- `mobile_research_archive_opened`
- `footer_navigation_opened`

服务器只接受经过逐项校验的属性：`acquisition_channel`、`campaign_id`、`content_id`、
`content_type`、`destination`、`destination_group`、`node`、`path`、`section`、
`source_id`、`step`、`story`、`viewport_class`。新增事件或属性时，必须同时更新代码白名单、本文件与验收测试。

来源类别固定为：`direct`、`internal`、`wechat`、`xiaohongshu`、`douyin`、`zhihu`、
`weibo`、`search`、`newsletter`、`qr`、`other_referral`。当前活动编号固定为：
`pingdiquan-01`、`same-name-01`、`ai-family-history-01`、`personal-home-01`、
`studio-beta-01`。未登记值不会落盘。

## 推荐北极星指标

公开后第一阶段不追求“总访问量”，而看**每周有效阅读者**：在一周内完成至少一个内容价值动作的匿名会话，例如打开完整专题、查看原件、进入图谱路线、继续下一篇或提交真实联系意向。

四条可验证路径：

1. 阅读激活：页面进入 → 专题打开 → 有效阅读 → 下一步。
2. 证据可信：历史内容深读 → 原件打开 → 图谱或未解问题。
3. 追更回访：有效阅读 → 追更入口 → 再次有效阅读。
4. 服务转化：工作室 → 案例 → 咨询意向 → 提交成功。

当前“读到文末”和“有效阅读后继续探索”是两个并行结果，不把“必须完读”作为查看原件或下一篇的前提。
目前只实现前三条的一部分和私密留言提交；没有订阅、公开评论、支付或正式服务申请。

## 未来接入 Amplitude 的门槛

- 网站公开发布和素材权利审核均已通过；
- 通过环境变量提供 API Key，不写入仓库；
- 隐私说明、同意方式、保留期限和删除流程已确认；
- 先在浏览器 Live Events 逐项验收，再建立正式漏斗；
- Browser SDK 明确设置 `autocapture: false`、`fetchRemoteConfig: false`；
- 禁用 Session Replay、表单捕获、网络捕获、全量点击与自动收集搜索参数；
- 不发送姓名、联系方式、家族材料、留言正文、搜索词、原件本地路径或可识别身份的数据；
- 第一轮只迁移上述经过清洗的事件，不让本地层和 Amplitude 双重计数。

官方参考：

- [Amplitude Browser SDK 2](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2)
- [Amplitude User Privacy API](https://www.amplitude.com/docs/apis/analytics/user-privacy-v2)
