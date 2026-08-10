'use client';

import JSZip from 'jszip';
import { toBlob } from 'html-to-image';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileWarning,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  allMediaMotherContent,
  evaluateMediaGate,
  mediaGateReasonLabels,
  mediaMotherContent,
  mediaPlatforms,
  mediaThemes,
  type EditorialLabel,
  type MediaMotherContent,
  type MediaPlatform,
  type MediaPlatformId,
  type MediaTheme,
  type MediaThemeId,
} from '@/content/media-studio';
import {
  buildDistributionPackage,
  buildMediaTextFiles,
  buildPlatformCaption,
} from '@/lib/media-package';

const editorialLabels: Record<EditorialLabel, string> = {
  fact: '史实摘录',
  interpretation: '编辑解释',
  fiction: '文学虚构',
};

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('浏览器没有允许复制，请手动选择文案。');
}

export function MediaStudioClient() {
  const [contentId, setContentId] = useState<string>(
    mediaMotherContent[0].id,
  );
  const [platformId, setPlatformId] = useState<MediaPlatformId>(
    mediaPlatforms[0].id,
  );
  const [themeId, setThemeId] = useState<MediaThemeId>(mediaThemes[0].id);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const content = useMemo<MediaMotherContent>(
    () =>
      allMediaMotherContent.find((item) => item.id === contentId) ??
      mediaMotherContent[0],
    [contentId],
  );
  const platform = useMemo<MediaPlatform>(
    () =>
      mediaPlatforms.find((item) => item.id === platformId) ??
      mediaPlatforms[0],
    [platformId],
  );
  const theme = useMemo<MediaTheme>(
    () => mediaThemes.find((item) => item.id === themeId) ?? mediaThemes[0],
    [themeId],
  );

  const gateDecision = useMemo(() => evaluateMediaGate(content), [content]);
  const caption = useMemo(
    () =>
      gateDecision.allowed ? buildPlatformCaption(content, platform) : '',
    [content, gateDecision.allowed, platform],
  );
  const previewSentences = useMemo(
    () =>
      content.body
        .split(/(?<=[。！？])/u)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .slice(0, platform.id === 'long_video' ? 2 : 3),
    [content, platform.id],
  );
  const blockedCount =
    allMediaMotherContent.length - mediaMotherContent.length;

  const previewStyle = {
    '--media-background': theme.colors.background,
    '--media-foreground': theme.colors.foreground,
    '--media-accent': theme.colors.accent,
    '--media-muted': theme.colors.muted,
    aspectRatio: `${platform.dimensions.width} / ${platform.dimensions.height}`,
  } as CSSProperties;

  async function handleCopy(): Promise<void> {
    setError('');
    setNotice('');
    try {
      if (!gateDecision.allowed) {
        throw new Error(
          `传播门禁已阻断：${gateDecision.reasons.map((reason) => mediaGateReasonLabels[reason]).join('；')}`,
        );
      }
      await copyToClipboard(caption);
      setNotice('平台文案已复制。仍需人工复核后发布。');
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : '复制失败，请稍后再试。',
      );
    }
  }

  async function handleExport(): Promise<void> {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!gateDecision.allowed) {
        throw new Error(
          `传播门禁已阻断：${gateDecision.reasons.map((reason) => mediaGateReasonLabels[reason]).join('；')}`,
        );
      }
      const previewNode = previewRef.current;
      if (!previewNode || previewNode.offsetWidth === 0) {
        throw new Error('预览画布尚未准备好，请刷新后重试。');
      }

      const generatedAt = new Date().toISOString();
      const distributionPackage = buildDistributionPackage(
        content,
        platform,
        theme,
        generatedAt,
      );
      const exportPixelRatio =
        platform.dimensions.width / previewNode.offsetWidth;
      const coverBlob = await toBlob(previewNode, {
        backgroundColor: theme.colors.background,
        cacheBust: true,
        pixelRatio: exportPixelRatio,
      });
      if (!coverBlob) throw new Error('封面渲染失败，请切换主题后重试。');

      const zip = new JSZip();
      zip.file('cover.png', coverBlob);
      for (const file of buildMediaTextFiles(
        content,
        platform,
        distributionPackage,
      )) {
        zip.file(file.path, file.content);
      }
      const archive = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      triggerDownload(
        archive,
        `handx-${content.id}-${platform.id}-${theme.id}-review-only.zip`,
      );
      setNotice(
        `审稿包已生成：${platform.dimensions.width}×${platform.dimensions.height} 封面、文案、来源快照与审核清单。`,
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : '导出失败，请稍后再试。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-owner-only="local-loopback">
      <section className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(28rem,1.2fr)] lg:items-end lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 border border-[#8ea299]/40 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#b7c7bf] uppercase">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              主人工作台 · 仅本机
            </p>
            <h1 className="mt-7 font-serif text-[clamp(1.97rem,3.94vw,3.77rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
              媒体矩阵
              <span className="block text-[#c38a82]">审稿台</span>
            </h1>
          </div>
          <div>
            <p className="font-serif text-2xl leading-relaxed text-[#e1dbd1] sm:text-3xl">
              一键生成的是审稿包，
              <br />
              不是未经确认的自动发布。
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-[1.8] text-[#bdb9b0]">
              选择母内容、平台和视觉主题，在浏览器中生成封面与平台文案。
              所有包均为 review_only，不连接账号、不保存令牌，也不调用直发接口。
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-[#f4f0e8]">
        <div className="personal-shell grid gap-px bg-foreground/15 sm:grid-cols-3">
          <div className="bg-[#f4f0e8] p-6 sm:p-8">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-6 block font-serif text-3xl">
              {mediaMotherContent.length}
            </strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              条通过事实、来源与权利门禁
            </span>
          </div>
          <div className="bg-[#f4f0e8] p-6 sm:p-8">
            <FileWarning className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-6 block font-serif text-3xl">
              {blockedCount}
            </strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              条因模式、身份、来源或权利被阻断
            </span>
          </div>
          <div className="bg-[#f4f0e8] p-6 sm:p-8">
            <PackageCheck className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-6 block font-serif text-3xl">
              review_only
            </strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              V0.1 唯一允许的包状态
            </span>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f0e8] py-12 sm:py-18">
        <div className="personal-shell grid gap-10 xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)] xl:items-start xl:gap-14">
          <div className="space-y-9 xl:sticky xl:top-24">
            <div>
              <label
                htmlFor="media-source"
                className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase"
              >
                01 · 选择母内容
              </label>
              <select
                id="media-source"
                value={content.id}
                onChange={(event) => {
                  setContentId(event.target.value);
                  setNotice('');
                  setError('');
                }}
                className="mt-3 min-h-12 w-full border border-foreground/20 bg-white/50 px-4 text-sm outline-none transition focus:border-primary"
              >
                {allMediaMotherContent.map((item) => {
                  const gate = evaluateMediaGate(item);
                  return (
                    <option key={item.id} value={item.id}>
                      {gate.allowed ? '可生成' : '已阻断'}｜{item.shortTitle}
                    </option>
                  );
                })}
              </select>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {content.angle}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="border border-primary/25 px-2 py-1 text-[10px] text-primary">
                  {editorialLabels[content.editorial_label]}
                </span>
                <span className="border border-primary/25 px-2 py-1 text-[10px] text-primary">
                  {content.disclosure_label}
                </span>
                <span className="border border-foreground/15 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {content.revision_hash.slice(0, 23)}…
                </span>
              </div>
              <div
                className={`mt-4 border p-4 text-xs leading-6 ${
                  gateDecision.allowed
                    ? 'border-[#48725f]/30 bg-[#48725f]/5 text-[#315b49]'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                }`}
                data-media-gate={gateDecision.decision}
              >
                <strong className="block text-sm">
                  {gateDecision.allowed
                    ? '已通过：可以生成本地审稿包'
                    : '已阻断：只能在工作台预览'}
                </strong>
                {gateDecision.allowed ? (
                  <div className="mt-1 space-y-1">
                    <p>主张、来源定位和权利护照均可追溯；输出仍固定为 review_only。</p>
                    <p>
                      当前按 {content.traceability.source_families.length} 个独立作品家族计权；同一作品的索引、翻刻或不同载体不重复增加证据数。
                    </p>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {gateDecision.reasons.map((reason) => (
                      <li key={reason}>· {mediaGateReasonLabels[reason]}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                02 · 选择平台模板
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {mediaPlatforms.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPlatformId(item.id);
                      setNotice('');
                      setError('');
                    }}
                    className={`flex min-h-12 items-center justify-between gap-3 border px-4 text-left text-sm transition ${
                      platform.id === item.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-foreground/15 bg-white/35 hover:border-primary'
                    }`}
                    aria-pressed={platform.id === item.id}
                  >
                    <span>{item.name}</span>
                    <span className="font-mono text-[9px] opacity-75">
                      {item.dimensions.width}×{item.dimensions.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                <Palette className="size-3.5" aria-hidden="true" />
                03 · 选择视觉主题
              </p>
              <div className="mt-3 grid gap-2">
                {mediaThemes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setThemeId(item.id);
                      setNotice('');
                      setError('');
                    }}
                    className={`grid grid-cols-[auto_1fr] gap-3 border p-3 text-left transition ${
                      theme.id === item.id
                        ? 'border-primary bg-white/70'
                        : 'border-foreground/15 bg-white/25 hover:border-primary'
                    }`}
                    aria-pressed={theme.id === item.id}
                  >
                    <span
                      className="mt-0.5 grid size-9 grid-cols-2 overflow-hidden border border-foreground/15"
                      aria-hidden="true"
                    >
                      <span style={{ backgroundColor: item.colors.background }} />
                      <span style={{ backgroundColor: item.colors.accent }} />
                      <span style={{ backgroundColor: item.colors.foreground }} />
                      <span style={{ backgroundColor: item.colors.muted }} />
                    </span>
                    <span>
                      <strong className="block text-sm">{item.name}</strong>
                      <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-4 border-b border-foreground/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                  平台预览
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold">
                  {platform.channelLabel}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                目标尺寸 {platform.dimensions.width} × {platform.dimensions.height}
              </p>
            </div>

            <div className="mt-7 flex justify-center overflow-hidden border border-foreground/15 bg-[#d8d2c6] p-4 sm:p-8">
              <div
                ref={previewRef}
                style={previewStyle}
                className={`relative flex w-full max-w-[540px] overflow-hidden bg-[var(--media-background)] p-[7%] text-[var(--media-foreground)] shadow-2xl ${
                  platform.id === 'long_video'
                    ? 'flex-row items-end gap-[6%]'
                    : 'flex-col'
                }`}
                data-export-width={platform.dimensions.width}
                data-export-height={platform.dimensions.height}
                data-package-status="review_only"
                data-media-gate={gateDecision.decision}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      theme.id === 'archive_red'
                        ? 'repeating-linear-gradient(0deg, transparent 0 31px, currentColor 32px)'
                        : theme.id === 'documentary_film'
                          ? 'radial-gradient(circle at 20% 20%, currentColor 0 1px, transparent 1.5px)'
                          : 'linear-gradient(90deg, transparent 0 96%, currentColor 96% 96.4%, transparent 96.4%)',
                    backgroundSize:
                      theme.id === 'documentary_film' ? '8px 8px' : 'auto',
                  }}
                  aria-hidden="true"
                />

                <div
                  className={`relative z-10 ${
                    platform.id === 'long_video' ? 'w-[58%]' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[clamp(0.48rem,1.4vw,0.72rem)] font-semibold tracking-[0.15em] uppercase">
                    <span className="border border-current/30 px-2 py-1">
                      Handx web0.1
                    </span>
                    <span style={{ color: theme.colors.accent }}>
                      {content.disclosure_label}
                    </span>
                  </div>
                  <h3
                    className={`mt-[8%] font-serif font-semibold leading-[1.04] tracking-[-0.045em] ${
                      platform.id === 'long_video'
                        ? 'text-[clamp(1.12rem,3.15vw,2.31rem)]'
                        : 'text-[clamp(1.04rem,3.64vw,2.34rem)]'
                    }`}
                  >
                    {content.hook}
                  </h3>
                  <div
                    className="mt-[7%] h-1 w-16"
                    style={{ backgroundColor: theme.colors.accent }}
                    aria-hidden="true"
                  />
                </div>

                <div
                  className={`relative z-10 ${
                    platform.id === 'long_video'
                      ? 'w-[36%] border-l border-current/20 pl-[4%]'
                      : 'mt-auto'
                  }`}
                >
                  <p
                    className="text-[clamp(0.72rem,2vw,1.12rem)] font-medium leading-relaxed"
                    style={{ color: theme.colors.accent }}
                  >
                    {content.angle}
                  </p>
                  <div className="mt-[6%] space-y-2">
                    {previewSentences.map((sentence) => (
                      <p
                        key={sentence}
                        className="text-[clamp(0.58rem,1.55vw,0.86rem)] leading-relaxed"
                        style={{ color: theme.colors.muted }}
                      >
                        {sentence}
                      </p>
                    ))}
                  </div>
                  <div className="mt-[8%] flex items-end justify-between gap-4 border-t border-current/20 pt-[4%] text-[clamp(0.45rem,1.2vw,0.68rem)]">
                    <span>
                      {content.evidence_snapshot.claim_ids.join(' · ') ||
                        '方法论内容'}
                    </span>
                    <span className="text-right">
                      内部审稿
                      <br />
                      尚未授权发布
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!gateDecision.allowed}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-foreground/20 bg-white/45 px-5 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Copy className="size-4" aria-hidden="true" />
                复制平台文案
              </button>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={busy || !gateDecision.allowed}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                {busy ? '正在生成审稿包…' : '下载 ZIP 审稿包'}
              </button>
            </div>

            {(notice || error) && (
              <p
                className={`mt-4 flex items-start gap-2 border p-4 text-sm leading-6 ${
                  error
                    ? 'border-destructive/30 bg-destructive/5 text-destructive'
                    : 'border-[#48725f]/30 bg-[#48725f]/5 text-[#315b49]'
                }`}
                role={error ? 'alert' : 'status'}
              >
                {error ? (
                  <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                )}
                {error || notice}
              </p>
            )}

            <div className="mt-9 grid gap-6 border-t border-foreground/15 pt-7 lg:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                  <Layers3 className="size-3.5" aria-hidden="true" />
                  当前包会包含
                </p>
                <ul className="mt-4 space-y-2 text-xs leading-6 text-muted-foreground">
                  {platform.deliverables.map((deliverable) => (
                    <li key={deliverable} className="flex items-start gap-2">
                      <span className="mt-2 size-1 shrink-0 bg-primary" aria-hidden="true" />
                      {deliverable}
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <span className="mt-2 size-1 shrink-0 bg-primary" aria-hidden="true" />
                    主张／来源定位、权利护照与人工审核清单
                  </li>
                </ul>
              </div>

              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  人工发布入口
                </p>
                {platform.workspace_links.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {platform.workspace_links.map((workspace) => (
                      <a
                        key={workspace.href}
                        href={workspace.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-between gap-3 border border-foreground/15 px-3 text-xs transition hover:border-primary hover:text-primary"
                      >
                        {workspace.label}
                        <ExternalLink className="size-3.5" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 border border-dashed border-foreground/20 p-4 text-xs leading-6 text-muted-foreground">
                    朋友圈没有通用后台入口。请下载后在手机端人工发布。
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-white/25 py-12 sm:py-16">
        <div className="personal-shell grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-8">
          <PackageCheck className="size-8 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-3xl font-semibold">V0.1 发布门禁</h2>
            <div className="mt-5 grid gap-4 text-sm leading-[1.8] text-muted-foreground sm:grid-cols-2">
              <p>
                只有 source_backed、主张与来源可定位、权利允许审稿复用，且不含未核身份、真人关键因果和家属私密材料的内容可以导出。问题、解释与文学内容必须显式标注，并停留在预览区。
              </p>
              <p>
                所有导出包固定为 review_only、must_not_deploy=true、auto_publish=false、external_egress=deny。“打开平台后台”只做人工导航，不会上传、授权或发布。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
