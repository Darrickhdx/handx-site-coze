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
- 先审后显的章节评论及本机审核队列；
- 故事模式、审计研究模式和明确隔离的 Legacy 线索；
- 人物、事件、机构、地点、职务和文献 Wiki；
- 仅持本机管理员密钥可见的主人语料命中索引；
- 问题驱动的历史专题与仅供内部审稿的媒体素材包。

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
  投稿与审核事件分别追加保存在 `private-runtime/`，不采集 IP 和 User-Agent；
- 评论只代表读者意见，即使批准显示，也不得自动成为知识图谱主张、史料来源、专题证据或媒体事实卡；
- 主人语料索引只返回 P1 文档标题、定位和材料类别；P2／P3 正文、本机绝对路径与家属私密内容不发送到浏览器。
  自动命中只是一条检索线索，不生成事实关系；
- 媒体矩阵导出包全部固定为 `review_only`，不登录平台、不保存平台令牌、不调用直发接口。
  下载包必须经人工事实、权利和平台适配复核，才能在未来被单独提升为 `public_ready`。

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
pnpm corpus:index
pnpm media:verify
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
`pnpm hooks:install` 会让本仓库在提交和推送前自动执行发布边界检查；新克隆的工作副本需执行一次。

运行`pnpm data:build`或`pnpm build`前应先停止正在运行的本地预览服务器。五文件提交协议会让
中断后的混合状态无法通过启动校验，但已启动的静态服务器不会在每个HTTP请求上重新执行整套校验。

## 页面与数据接口

主要页面组：

- 个人站：`/`、`/about`、`/discover`、`/studio`、`/rights`、`/privacy`；
- 小说：`/novel`、`/novel/read`、`/novel/chapter/[slug]`；
- 苏开元研究：`/sukaiyuan`、`/person`、`/timeline`、`/archives`、`/graph`、`/wiki`、
  `/legacy`、`/controversies`、`/methodology`；
- 传播工作台：`/topics`、`/studio/media`；
- 主人本机入口：`/insights`、`/studio/comments`，以及 Wiki 实体页内的语料命中索引。

本地 JSON 接口共4个：

- `/data/persons.json`
- `/data/events.json`
- `/data/timeline.json`
- `/data/sources.json`

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

所有路由均返回`Cache-Control: private, no-store, max-age=0, must-revalidate`和
`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`；`robots.txt`对所有抓取器返回
`Disallow: /`。这只是防误公开措施，不能代替网络隔离和人工授权。

## Handx web0.1 验收要求

- `pnpm data:verify`必须逐项核对V7R4的5/5/7/5计数、三组事件派生、v7快照ID、
  五个输入哈希、已记录代次完整性和`CURRENT`新鲜度，且所有被暂缓ID均未进入派生JSON；
- `pnpm data:test`必须拒绝损坏的`CURRENT`、符号链接权威根、构建中指针切换和部分提交，并证明旧扁平目录哨兵不会被读取；
- `pnpm graph:verify`必须核对审计图 229/127/211/131、Legacy 107/151 与 258 条迁移映射，
  并保证默认研究查询不混入 Legacy；
- `pnpm novel:verify`必须核对 182 页唯一归属、32 个编号章节、34 个可评论段落、
  原尺寸与响应式两套页面哈希，以及 7 页 `local_only`；
- `pnpm media:verify`必须阻断 `not_for_media`／Legacy 内容进入导出，并保证所有包仍为 `review_only`；
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
