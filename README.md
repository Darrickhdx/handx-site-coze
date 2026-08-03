# Handx web0.1｜鉴真小秃驴个人网站本地审阅版

这是从 Coze Code 原始交付复制出来的本地工作副本。它已经接入经过审计的
`previewable` 公开数据，不再使用原型中的演示人物、虚构事件或伪引文。

当前状态：**只批准本地预览，禁止部署或公开发布。**

### 本机威胁模型

V0.1 把同一台电脑上的本地进程、浏览器扩展和能够读取站主账户文件的程序视为同一信任域。
Origin／CSRF、回环监听和本机 Bearer 密钥用于防止误操作与普通网页跨站请求，并不能对抗已经控制
本机账户的恶意程序。管理员密钥只保存在 `private-runtime/admin-token`，文件权限为 0600；
需要轮换时，停止预览、删除该文件并重新启动，由服务器在本机生成新密钥。不要把密钥复制到浏览器
持久化存储、Git、聊天记录或媒体导出包。

## Handx web0.1

`Handx web0.1` 是当前工程基线，继续保留原有苏开元可审计研究能力，并增加：

- 《英雄无名》带水印页图的全文与分章阅读；
- 小说版本大厅、史实来源伴读与站主换版门禁；
- 先审后显的章节评论及本机审核队列；
- 故事模式、审计研究模式和明确隔离的 Legacy 线索；
- 人物、事件、机构、地点、职务和文献 Wiki；
- 仅持本机管理员密钥可见的主人语料命中索引；
- 问题驱动的历史专题与仅供内部审稿的媒体素材包。
- 六人策展群像与逐条回源的人物故事档案。
- 不上传、不留存答案的 AI 家族史起步诊断与方法演示。
- 33 项查档任务、公开研究日志、浏览器内线索草稿与站主只读行动台。

项目允许推送到站主账号下的**私有 GitHub 仓库**进行工程版本管理，但这不构成公开发布授权。
原始小说、家属材料、第三方原件、运行数据、平台凭证和未获许可的派生资产不得进入仓库。
版本号只表示工程基线，不表示历史主张已经全部核验，也不表示内容已获公网传播许可。

### V0.1 内容与权利边界

- 《英雄无名》管线核对 182 页、32 个编号章节，并覆盖前言、楔子、分部、尾声、后记与附录；
  阅读页是带像素水印的 WebP 派生图，并为每页生成 760 像素宽的响应式副本；
  浏览器按视口选择清晰度，原始 DOCX、PDF 不进入静态路由、构建产物或 Git；
- 第 6、14、22、28、47、116、177 页含家属影像或权利尚未闭环的第三方图版，
  固定标记为 `local_only` 与 `not_for_media`，只保存在本机且不进入私有 GitHub 仓库或媒体包；
- 水印文案为“© 韩大昕｜鉴真小秃驴 · 仅供本站阅读”。它只能提高直接复制成本，
  不能阻止截图、抓包或 OCR，也不等于已经发放转载、训练或改编许可；
- 32 个编号章节、楔子与尾声开放评论。投稿默认 `pending`，公开章节只显示管理员批准的内容；
  评论与阅读进度使用 `edition_id` 命名空间隔离，旧版内容不会自动迁移到重写后的新版本；
  投稿与审核事件分别追加保存在 `private-runtime/`，不采集 IP 和 User-Agent；
- 评论只代表读者意见，即使批准显示，也不得自动成为知识图谱主张、史料来源、专题证据或媒体事实卡；
- 主人语料索引只返回 P1 文档标题、定位和材料类别；P2／P3 正文、本机绝对路径与家属私密内容不发送到浏览器。
  自动命中只是一条检索线索，不生成事实关系；
- 媒体矩阵导出包全部固定为 `review_only`，不登录平台、不保存平台令牌、不调用直发接口。
  下载包必须经人工事实、权利和平台适配复核，才能在未来被单独提升为 `public_ready`。

### 2026-08-04 小说版本治理

- 网站当前仍提供经验证的《英雄无名》V0.3 本地阅读器（182页、32个编号章节）；
- V1.2 是已冻结的差异对照与回滚基线，不提供网页阅读；
- V1.3 是正在编辑的候选版。构建只读取其哈希和结构，不复制原始 PDF、DOCX、Markdown，
  也不生成候选页图；
- `/novel/editions` 向读者解释当前版、冻结版与候选版，`/novel/companion` 把关键小说节点
  接回来源卡并说明文学边界，`/studio/novel-migration` 仅展示安全的换版门禁摘要；
- V1.3 当前观察到 47 幅正文图版，而结构化权利台账只有 26 条。冻结说明、完整权利护照、
  终检报告、作者／法定权利人确认及页码视觉核验全部完成前，禁止切换；
- 版本登记由 `pnpm novel:editions:build` 重建，`pnpm novel:editions:verify` 会拒绝本机绝对路径、
  原始正文泄漏、错误冻结状态或绕过并行迁移门禁。

### 2026-08-04 故事证据链与原件查看台

- `/evidence` 把小说阅读、原子主张、来源定位和边界裁决连成五条读者路径；其中只有三条进入
  受控桥接白名单，另外两条专门演示“没有来源时必须停下”；
- 三条桥接只使用当前 V7R4 安全预览的 5 条主张与 5 项来源：1936 平地泉是“来源伴读”，
  1933 任命与 1942 编成表是“研究旁注”。三者均固定 `personFactAllowed=false`，当前真人事实场景数为 0；
- 桥接合同绑定《英雄无名》V0.3 的 PDF／DOCX 哈希、章节页图摘要和研究代次哈希。任一版本、页码、
  来源或主张漂移都会使 `pnpm evidence:verify` 失败；V1.3 不复用 V0.3 合同；
- SRC-002 与 SRC-013 是同一作品的转录／影印载体，只计一个来源家族；SRC-042 是索引，不让
  SRC-039 的任命记录看起来像双源；
- `/archives/[sourceId]` 增加原件查看台。只有 SRC-013 的已登记局部图可在本机查看，仍是
  `local_internal_preview_only`、`publishable=false`、`notForMedia=true`；其他来源默认显示精确定位并
  跳转机构网站，不 iframe、不代理整份 PDF，也不把本地载体状态当展示许可；
- 章节页增加“真实与虚构伴读”，来源页使用白名单 `context` 返回证据链；评论、小说和页面交互
  仍不能写回或提升史料主张。

### 2026-08-04 人物群像与故事档案

- `/persons` 首批策展苏开元、李英夫、李大超（绥远军人）、朱自清、乔培新与傅作义六人，
  `/persons/[entityId]` 先回答“是谁、为什么值得读”，再展开原子主张与来源；
- 人物档案只从审计图中人工白名单选择的 19 个节点生成，所有节点都要求
  `claim → source → locator` 可回溯；旧 AI、小说草稿和文学材料被机器门禁禁止生成生平；
- “文献同现”“参与者回忆”“候选制度锚”“不支持”使用不同读者标签。待档与候选边明确不计作
  已证真人交集，关系卡不会把并列名单、共同机构或后出回忆升级为私交；九条策展关系同时冻结
  `edge_id + edge_status + claim_ids`，新增或换线关系默认阻断；
- 每条人物主张显示“载体／索引数”和独立来源数；《绥行纪略》转录与影印、地方志公开页与扫描、
  公报影印与数据库索引按同一作品家族标注，不因链接数量增加证据权重；
- 李英夫与李广荣保持分离，绥远军人李大超与 P-020／P-029／P-031 同名轨保持分流；
- 当前没有登记足以安全使用的李英夫、李大超历史肖像，六页统一使用文字印记，不生成假头像；
- 所有人物页均为 `local_review_only` 与“非完整传记”。生存状态不明者不作推断，公开历史人物也
  只使用项目已登记的公共材料；完整隐私、同意和权利门禁通过前不得公开发布。

### 2026-08-04 AI 家族史起步诊断

- `/studio/diagnosis` 用五个选择题把访客引向资料盘点、身份分流、调档路线、证据型叙事或隐私优先；
- 自评只在当前 React 页面内存中计算，不接收自由文本或文件，不写入网址、统计、留言、Cookie、
  `localStorage` 或 `sessionStorage`，不调用外部模型；刷新、退出或关闭页面即清空；
- 涉及在世人物、私人通信、未成年人或授权不明时，隐私优先具有硬覆盖，结果页不显示访谈入口；
- 其余结果只允许由访客主动复制不含姓名和原文的摘要，或打开预填邮件；网站不会自动发送；
- 页面公开演示两个研究合同：`SRC-002/SRC-013` 是同一作品的两个载体、只计一个独立来源；
  `SRC-103/SRC-104` 只构成候选身份桥，不能自动合并姓名轨；
- 当前服务状态固定为 `small_scope_interview_only_not_paid_order`：正式收费、上传、支付、外部模型处理、
  自动事实生成与自动发布均未开放。`pnpm family-history:verify` 会阻断上述边界漂移。

### 2026-08-04 查档现场与行动基线

- `/missions` 将 2026-07-28 的 33 项档案馆、图书馆与博物馆调查方向转成读者可理解的行动清单；
  其中 7 项是首批精确任务、39 个结构化申请目标，当前取得并核读为 0；
- P0／P1／P2 只表示执行顺序，不是隐私级别或证据等级。`planned`／`blocked` 是行动状态，
  不得换算为历史研究完成率；申请准备、发送、受理、取得材料与完成核读必须分开记录；
- `/missions/[taskId]` 说明研究问题、馆藏定位、完成标准和“即使取得也不能自动证明什么”；
  A004 的编号异写按一个目标处理，A013 与 A020 分别拆成 3／4 项申请，A015 的两个馆藏入口仍只算同一作品家族；
- 公开线索工具只在当前页面内存中生成 JSON 草稿，拒绝非 HTTPS、内网、含账号密码的网址；它不提交、
  不保存、不抓取、不接收文件，也不创建人物事实。正式线索接收入口仍为关闭状态；
- `/studio/research-log` 通过本机管理员令牌只读 `private-runtime/archive-missions-owner.json`，
  原始精确请求、前置条件、内部下一动作和备注不会进入公开 JSON；本轮不提供任务状态写入接口；
- `pnpm missions:build` 从唯一 CSV 基线确定性重建公开／主人数据，`pnpm missions:verify` 校验输入 SHA、
  33／39／7／0 数量、字段白名单、特殊粒度、文件权限、公开泄漏和零提交端点合同。

## 2026-07-24 个人 IP 身份层

站主已明确使用网名“鉴真小秃驴”，并提供头像、微信二维码与联系邮箱。当前版本据此完成：

- 首页首屏与“关于站主”区统一为“AI × 硬件 × 产品 × 家族史”定位；
- `/about` 成为完整个人页，包含 AI 实践方向、职业路径、教育背景、建站缘起与联系入口；
- 四项代表项目使用本站原创系统示意图，不复制公司官网照片、商标、界面或产品独特外观；
- 专题文章增加作者署名，`/studio` 增加发起人能力与联系信任链；
- Header、Footer、metadata 与站内导航统一公开称呼；
- 头像与二维码纳入静态资产封闭清单，二维码保持完整原图，不裁切、不改码。

以上职业经历由站主本人提供，页面明确标记为本地审阅信息。头像、二维码和邮箱虽然由站主主动提供，
但当前整体仍处于 `publishable=false`、`must_not_deploy=true` 状态；公开上线必须另行完成逐项授权与隐私确认。

## 2026-07-21 个人主站与苏开元旗舰专题首版

根路由现为站主的个人数字花园首页，承载 AI、家族史、写作旅行与个人成长四条内容路径；
`/sukaiyuan` 为首个旗舰专题。苏开元专题采用“故事先行、证据可追溯”的叙事方式：
以1936年平地泉和朱自清《绥行纪略》为首版文献入口，依次呈现同期摘录、能证与不能证、
1933／1936／1942三组断片、同源载体说明和研究档案入口。原有研究路由、V7R4数据门禁、
身份边界和本地部署限制均保持不变。

专题首屏用读者语言明确说明：1936年文献中的姓名和称谓已经核对，但与家族人物是否为
同一人尚未证实。底层`identity_link_status=candidate`与`scene_eligible=false`仍由数据层保留：
材料只说明朱自清文本如何记载一位同名对象，不用于人物塑造、现场还原、履历串联、
小说或影视事实依据。

首版与V2使用的五项静态视觉资产登记在`public/assets/asset-manifest.json`，记录哈希、来源类型、
公开范围和部署门禁；其中站主头像与微信二维码由本人明确提供，用于本地个人 IP 页面审阅，
仍保持`publishable=false`。HTTP冒烟测试会逐一校验文件哈希，并确认已撤下或未获授权的旧图无法访问。

页面事件标记现已接入纯本机第一方分析层；只记录脱敏 pathname、事件名、白名单属性、
时间与加盐会话哈希，不初始化第三方分析 SDK，也不向外部发送浏览数据。
事件词表、禁止字段与未来 Amplitude 上线门槛见
[`AMPLITUDE-TRACKING-PLAN.md`](./AMPLITUDE-TRACKING-PLAN.md)。

## 2026-07-26 版权、隐私、评论与主人工作台

- `/rights` 提供“开放传播层／商业核心层／受限档案层”的版权与转载草案。草案在本地审阅阶段
  不视为已经对外发放 CC 许可，公开前仍需站主最终确认；
- 三篇文章均有唯一 `RP-DISC-*` 权利身份证，许可状态为 `no-license-granted`，逐项列出
  作者、版本、原作者与来源、第三方材料和复用边界；本地地址不会被复制成公开原文；
- `/privacy` 如实列出本机统计与私密留言保存的字段、用途、边界和当前尚未自动清理的限制；
- `/about` 增加私密留言表单。留言默认 `pending`，不会自动公开，也不会写入研究数据；
- `/novel/chapter/[slug]` 提供先审后显的章节评论，`/studio/comments` 是需要本机管理员令牌的审核入口；
- 小说评论的投稿正文与批准、拒绝、垃圾、撤回事件分文件追加记录；章节公开接口始终只返回已批准内容；
- `/insights` 在本机显示 30 日访问趋势、标签会话、预设来源类别、有效阅读里程碑、
  阅读路径和内容质量；精确到时间的最近活动、留言正文与回复方式需要
  `private-runtime/admin-token` 本机密钥才能打开；
- Wiki 实体页的“主人资料命中索引”使用同一本机密钥，只返回 P1 定位性元数据；
  P2／P3 内容、绝对路径与私密正文不会进入浏览器或 Git；
- `/studio/media` 在浏览器内生成 `review_only` 审稿包；它不连接外部生成服务或平台账号，
  不保存 OAuth token，也不进行自动发布；
- 运行数据写入 `private-runtime/` 的 NDJSON 文件，目录权限为 0700、文件权限为 0600，
  不在 `public/`、研究 JSON、构建产物或版本管理中；单文件达到 25 MiB 后停止追加，
  当前仍不自动删除旧数据；
- 职业经历仍标“本人提供”，外部链接只核验项目和时代背景，不冒充个人任职证明。
  详细核验见 [`CAREER-EVIDENCE.md`](./CAREER-EVIDENCE.md)。

## 2026-08-04 权利护照、版本状态与媒体事实门禁

- `/studio/rights-ledger` 将 5 项网站资产、182 张小说页图、3 篇原创文章、13 个专题段落和
  5 项来源登记拆成 208 份逐项权利护照。当前 193 项为本站控制的原创表达、2 项只有本地审阅授权、
  13 项权利待核；22 项不得进入媒体包，`public_ready=0`；
- 缺少权利依据的对象固定进入 `permission_pending`，所有护照都保持 `no-license-granted`、
  `release_gate=blocked`、`must_not_deploy=true`。头像和微信二维码的有限本地授权不被扩大为公开或商业授权；
- `/studio/media` 现在先执行事实、身份、来源定位、隐私和权利五重门禁。6 条母内容中只有
  “1933 年董其武公报任命记录”可生成本地审稿包；其余 5 条分别因身份未闭环、问题／解释模式、
  Legacy、真人关键因果或媒体改写权利链不足而阻断；
- 合格素材包使用 1.1 合同，附 `TRACEABILITY.json`、权利护照与人工清单，并固定为
  `review_only`、`auto_publish=false`、`external_egress=deny`；同一作品的原件、索引、翻刻或不同载体
  归入一个作品家族，不重复增加独立证据数；复制与 ZIP 也会再次执行同一门禁；
- `/studio/data-versions` 与 `/data/site-status.json` 分开显示历史数据代次、产品构建、权利状态和服务开关。
  数量只表示库存或门禁状态，不计算、暗示或展示历史研究完成率；
- 服务机器合同固定关闭文件上传、模型处理、向外传输、自动生成史实、支付、自动发布和公网部署。
  未知 schema、状态、输入漂移或源／浏览器 JSON 不一致时验证失败关闭；
- 全站响应增加 CSP、`X-Frame-Options: DENY`、`nosniff`、`no-referrer`、权限策略和同源隔离头，
  同时移除框架标识；程序化外传、文件上传控件、iframe 与远程图片白名单均保持为零。

## 2026-07-24 内容型 V2（历史演进记录）

这一节记录 V0.1 之前的内容型 V2；其中“小说试读”和早期图谱已经被本版全文阅读器与双模式图谱替代，
但史料事实源和身份门禁继续保留：

- 首页增加三篇完整专题、小说试读与四条真实可读内容路径；
- `/discover`聚合史料专题、身份谜题、AI研究方法及明确标为筹备中的后续选题；
- `/discover/1936-pingdiquan`、`/discover/same-name`、
  `/discover/ai-family-history`提供三篇可独立阅读的长文；
- `/novel`当时只展示三篇审计样章的有限摘录；当前改为 182 页全文／分章页图阅读，研究层仍保留 F／I／X 边界；
- `/graph`当时只读取 V7R4 的 7 节点／5 关系；当前改为故事模式与审计研究模式，并把 Legacy 候选层单独隔离；
- `/studio`说明家族史工作室的流程、隐私边界和当前未开放收费的状态；
- 新增一张全合成小说概念图，页面明确标“AI艺术想象，不是历史照片”。

V2 当时的网站内容素材、未授权家属影像和新获史料原件均在站点外单独归档。
当前全文阅读器的 7 页 `local_only` 派生页图只存在于本机 `public/` 工作副本，
已从 Git 与对外发布范围排除；小说内容始终不会写入 `src/data/research.json` 或任何史实 JSON。

## 数据边界与权威代次

- 权威入口：`AI网站媒体/02-史料公开层/公开导出/authority-v1/CURRENT`
- 不可变代次：`authority-v1/generations/gen-<64位SHA-256>/`
- 生成脚本：`tools/build_preview_data.py`
- 严格校验：`tools/verify_preview_data.py`
- 反向测试：`tools/test_generation_data.py`
- 本地门禁：`tools/assert-local-preview-gate.mjs`
- HTTP冒烟验证：`tools/smoke_test_local_preview.py`与`scripts/smoke-local.sh`
- 静态资产封闭清单：`public/assets/asset-manifest.json`与`tools/verify_static_assets.py`
- 页面读取：`src/data/research.json`
- 静态 JSON：`public/data/persons.json`、`events.json`、`timeline.json`、`sources.json`

当前V7R4权威代次的previewable层只含：5项来源、5条主张、7个节点、5条关系、3组事件锚（1933、
1936、1942）。1929记录与“苏开元—苏凯元”身份桥因混合公开／私有来源依赖
暂缓进入本地预览；这项安全降级不等于证伪。扫描件、
全文转录、家属私密材料、P2/P3 数据及旧小说均不进入网站数据。

Handx web0.1 在这层最小公开预览数据之外，另生成三套本地知识图谱数据，彼此不得自动混合：

- 审计研究模式：229 实体、127 关系、211 主张、131 来源；
- Legacy 线索层：107 节点、151 边，首次开启必须确认“旧研究候选，不构成事实”；
- 迁移映射：258 条，只用于说明旧线索去向，不自动合并身份或生成事实边。

Wiki 中可靠关系必须能够沿 `edge → claim_id → source_id → locator` 回到来源定位。
主人语料索引是独立的只读检索层，不改变任何实体、关系或主张的证据状态。

当前预览必须标记
`research_snapshot_id = 源数据工作版-2026-07-20-v7`，并逐项匹配v7来源、主张、节点、关系四个CSV及知识图谱JSON的
SHA-256。v7内部快照的总量是123/194/217/135；网站只读取经V7R4白名单选出的5/5/7/5，
不代表`candidate`层或被暂缓记录已获准公开。`publishable`当前为0。

生成器和校验器同时要求：

- `publication_layer = previewable`
- `preview_approved = true`
- `deployment_authorized = false`
- `must_not_deploy = true`

只要门禁不满足，构建或启动就会失败。服务器默认且强制只绑定
`127.0.0.1`、`localhost` 或 `::1`。

生成器通过共享的`public_generation_authority.py`只读一次`CURRENT`，在内存中锁定并完整校验一个32文件代次，
之后不重新打开代次路径，也不读取旧的扁平`previewable/`目录。五个派生JSON先全部在同文件系统上暂存，
再在排他锁内替换四个公开端点，最后替换`src/data/research.json`作为提交标记。校验器要求五份数据的
`generation_id`、`GENERATION.json` SHA-256、导出器版本和全部元数据完全一致；任何中途故障都只会得到一个被拒绝的混合状态。

`data:verify`先校验站点记录的不可变代次及其字节（`recorded_generation_integrity`），最后才单独重读
`CURRENT`判断是否仍新鲜（`current_freshness`）。后者绝不会偷偷改用另一个代次。

## 本地运行

要求 Node.js 20+、pnpm 9+、Python 3。

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm hooks:install
pnpm data:build
pnpm data:verify
pnpm data:test
pnpm graph:build
pnpm graph:verify
pnpm novel:build
pnpm novel:verify
pnpm novel:editions:build
pnpm novel:editions:verify
pnpm evidence:verify
pnpm people:verify
pnpm family-history:verify
pnpm missions:build
pnpm missions:verify
pnpm corpus:index
pnpm rights:passports:build
pnpm rights:passports:verify
pnpm media:verify
pnpm status:build
pnpm status:verify
pnpm security:verify
pnpm gate:local
pnpm rights:verify
pnpm release:verify
pnpm ts-check
pnpm lint:build
pnpm lint:style
pnpm build
pnpm smoke:local
DEPLOY_RUN_PORT=3217 pnpm start
```

打开 `http://127.0.0.1:3217`。`pnpm novel:build` 需要站点外的作者原始 DOCX/PDF，
只在需要重放页图管线时执行；日常验证使用 `pnpm novel:verify`。
`pnpm build` 会复核权威导出、图谱、小说清单、专题／媒体、权利与本地门禁，
再构建 Next.js 与本地服务器；它不是部署命令。
`pnpm start` 也会在监听端口前重新核对权利护照、媒体门禁、状态合同与安全边界；
任何构建后的本地篡改或输入漂移都会拒绝启动。
`pnpm hooks:install` 会让本仓库在提交和推送前自动执行发布边界检查；新克隆的工作副本需执行一次。

运行`pnpm data:build`或`pnpm build`前应先停止正在运行的本地预览服务器。五文件提交协议会让
中断后的混合状态无法通过启动校验，但已启动的静态服务器不会在每个HTTP请求上重新执行整套校验。

## 页面与数据接口

主要页面组：

- 个人站：`/`、`/about`、`/discover`、`/studio`、`/studio/diagnosis`、`/rights`、`/privacy`；
- 小说：`/novel`、`/novel/read`、`/novel/chapter/[slug]`、`/novel/editions`、`/novel/companion`；
- 苏开元研究：`/sukaiyuan`、`/evidence`、`/persons`、`/person`、`/timeline`、`/archives`、`/missions`、
  `/graph`、`/wiki`、`/legacy`、`/controversies`、`/methodology`；
- 传播工作台：`/topics`、`/studio/media`；
- 主人本机入口：`/insights`、`/studio/comments`、`/studio/migrations`、`/studio/novel-migration`，
  `/studio/research-log`、`/studio/rights-ledger`、`/studio/data-versions`，以及 Wiki 实体页内的语料命中索引。

研究预览 JSON 接口共4个：

- `/data/persons.json`
- `/data/events.json`
- `/data/timeline.json`
- `/data/sources.json`

另外两份确定性本地合同为：

- `/data/archive-missions.json`：33 项查档行动基线，不表示新增史实或研究完成率；
- `/data/site-status.json`：数据代次、产品、权利和服务状态机器合同。

另有仅接受本地来源的运行接口：

- `POST /api/local/analytics`
- `POST /api/local/messages`
- `GET /api/local/insights`
- `GET /api/local/inbox`（需要本机 Bearer 密钥）
- `GET /api/local/novel-comments?chapter=...`（只返回已批准评论）
- `POST /api/local/novel-comments`（始终进入 `pending`）
- `GET /api/local/novel-comments/inbox`（需要本机 Bearer 密钥）
- `POST /api/local/novel-comments/moderate`（需要本机 Bearer 密钥）
- `GET /api/local/corpus-hits?entity=...`（需要本机 Bearer 密钥，只返回 P1 定位元数据）
- `GET /api/local/research-missions`（需要本机 Bearer 密钥，只读返回查档行动私密基线）

所有路由均返回`Cache-Control: private, no-store, max-age=0, must-revalidate`和
`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`；`robots.txt`对所有抓取器返回
`Disallow: /`。同时返回 CSP、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、
`Referrer-Policy: no-referrer`、Permissions Policy、COOP 与 CORP，并移除 `X-Powered-By`。
这些只是防误公开和缩小攻击面，不能代替网络隔离和人工授权。

## Handx web0.1 验收要求

- `pnpm data:verify`必须逐项核对V7R4的5/5/7/5计数、三组事件派生、v7快照ID、
  五个输入哈希、已记录代次完整性和`CURRENT`新鲜度，且所有被暂缓ID均未进入派生JSON；
- `pnpm data:test`必须拒绝损坏的`CURRENT`、符号链接权威根、构建中指针切换和部分提交，并证明旧扁平目录哨兵不会被读取；
- `pnpm graph:verify`必须核对审计图 229/127/211/131、冻结 Legacy 107/151 与 258 条迁移映射，
  并验证实时图谱的 10 项既有记录变化、26 个新增节点、50 条新增关系均由 86 条无语义指纹记录逐项阻断；
  `ALLOW_LEGACY_GRAPH_REFRESH=1`本身不得构成发布授权；
- `pnpm novel:verify`必须核对 182 页唯一归属、32 个编号章节、34 个可评论段落、
  原尺寸与响应式两套页面哈希，以及 7 页 `local_only`；
- `pnpm people:verify`必须固定六人策展白名单、19 个叙事节点、九条关系证据合同、同名隔离、
  独立来源家族、无历史肖像、非完整传记与 `local_review_only`，并拒绝 D/E 主张、D/E 来源、
  小说或旧 AI 材料生成生平；
- `pnpm family-history:verify`必须固定五题、二十个选项、五类结果与两项公开方法演示，并拒绝
  网络请求、浏览器持久化、自由文本、文件上传、答案统计和外部模型调用；
- `pnpm rights:passports:verify`必须逐项核对 208 份权利护照、内容哈希、13 项待核权利、
  22 项媒体阻断和 `public_ready=0`，未知权利必须失败关闭；
- `pnpm media:verify`必须只允许 `source_backed + fact` 且主张／来源定位、身份与权利闭环的内容生成包，
  阻断 `not_for_media`、Legacy、家属私密、未核身份和真人关键因果；同一作品多载体必须归入一个
  `work_family_id` 且只计一个独立证据，并保证所有包仍为 `review_only`；
- `pnpm status:verify`必须证明源端与浏览器端状态合同逐字节一致，机器服务开关全部关闭，
  历史数量只作库存且不出现历史研究完成率；
- `pnpm security:verify`必须确认无远程图片白名单、程序化外传、文件上传控件与 iframe，
  且私密 JSON、监听地址和安全响应头继续失败关闭；
- `pnpm release:verify`必须拒绝原始 DOCX/PDF、密钥、私有运行数据、绝对私密路径和超限文件进入发布集合；
- `pnpm validate`必须通过TypeScript、ESLint与Stylelint；
- `pnpm build`必须通过Next.js生产构建与本地服务器打包；
- `pnpm smoke:local`必须覆盖核心静态页、小说章节、评论先审后显与越权拒绝、图谱／Wiki／专题／媒体工作台、
  182 张原尺寸页图与 182 张响应式页图、研究 JSON、登记静态资产、404、缓存头、抓取头、
  `robots.txt`和 v7 溯源检查；
- 章节首屏在 Lighthouse DevTools Fast 4G 模拟下连续两次测得 LCP 2.424 秒与 2.407 秒，
  CLS 均为 0；该结果是当前本机环境基线，不等同于未来公网环境承诺；
- 反向测试必须继续拒绝`COZE_PROJECT_ENV=PROD`与`HOSTNAME=0.0.0.0`；
- 不部署、不公开发布；仅允许在通过秘密、隐私、资产和权利检查后推送站主私有 GitHub 仓库，
  全部验收仍只覆盖本地审阅物。

## 来源链

- Coze 原始压缩包：`../Coze交付/su-kaiyuan-mvp-source.tar.gz`
- 原始解包：`../Coze交付/源码-9ea16f6/`
- 原始包 SHA-256：`1342ad0bdf3196d0c00d92c2908c0d4be295f9d2c7abff41e7e68063176b71f9`
- 本目录：在原始交付基础上进行事实数据、安全、响应式与无障碍修订的工作副本。

原始包与原始解包只作溯源，不在其中继续开发；所有修改只进入本目录。

## 明确禁止

- 未经发起人书面确认，不得部署、绑定域名、推送公开仓库或提交搜索引擎；
- 当前123项来源的网站、社交媒体、GitHub、出版、影视、全文和图像复用权利均为
  `not_granted`；本地可见不构成授权；
- 原始小说 DOCX/PDF、`private-runtime/`、平台令牌、评论记录、统计日志、主人语料索引和媒体导出包不得进入 Git；
- 小说第 6、14、22、28、47、116、177 页的派生页图只能保存在本机，不得进入私有仓库或任何对外发布物；
- 不得把“带水印”宣传为能够防止截图、抓包或 OCR，也不得以水印替代转载授权；
- 不得公开显示未经审核的章节评论；批准显示不等于史实核验，评论不得进入研究或媒体证据层；
- 媒体包在 V0.1 只能是 `review_only`，不得自动发布或携带 localhost 链接、平台凭证、家属材料与 Legacy 事实；
- 不得把 `previewable` 自动提升为 `publishable`；
- 不得把小说、AI推断、回忆转述或家属私密材料写入史实数据；
- 不得因同一作品有多个载体而增加独立来源数；
- 1929记录与“苏开元—苏凯元”身份桥当前必须整体暂缓；不得通过删除私有来源编号后
  继续透传混合依赖的主张、节点、关系或来源细节；
- `identity_candidates`允许为空，页面必须正常渲染；只有当前导出中真实存在且为
  `provisional`的身份主张才能动态进入该数组；
- 当前本地页面只能展示1933、1936、1942三组文献记录，并明确它们不构成完整生平；
- 不得把空白年份自动串成连续履历。
