'use client';

import { useRef, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  FileJson2,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

const leadKinds = [
  { value: 'official_catalog', label: '官方目录或馆藏入口' },
  { value: 'official_finding_aid', label: '官方查档指南或开放说明' },
  { value: 'published_bibliography', label: '公开出版物或书目线索' },
  { value: 'public_correction', label: '公开页面中的勘误或异写线索' },
] as const;

const observationScopes = [
  { value: 'catalog_metadata', label: '只看到了目录或元数据' },
  { value: 'specific_page_frame_issue', label: '看到了明确页、帧或期号' },
  { value: 'full_public_text', label: '看到了公开可读的完整正文' },
] as const;

type LeadKind = (typeof leadKinds)[number]['value'];
type ObservationScope = (typeof observationScopes)[number]['value'];

type Draft = {
  leadKind: LeadKind | '';
  observationScope: ObservationScope | '';
  url: string;
  sourceTitle: string;
  archiveOrCatalogId: string;
  page: string;
  frame: string;
  issue: string;
  publicOnly: boolean;
  authorityToShare: boolean;
};

const initialDraft: Draft = {
  leadKind: '',
  observationScope: '',
  url: '',
  sourceTitle: '',
  archiveOrCatalogId: '',
  page: '',
  frame: '',
  issue: '',
  publicOnly: false,
  authorityToShare: false,
};

const controlOrBidi = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

function containsUnsafeText(value: string): boolean {
  return controlOrBidi.test(value);
}

function isPrivateIpv4(hostname: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split('.').map(Number);
  if (parts.some((part) => part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || a >= 224
  );
}

function isPrivateHostname(rawHostname: string): boolean {
  const hostname = rawHostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || !hostname.includes('.') && !hostname.includes(':')) {
    return true;
  }
  if (
    hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.lan')
    || hostname.endsWith('.home')
    || hostname.endsWith('.test')
    || hostname.endsWith('.invalid')
    || hostname.endsWith('.example')
  ) {
    return true;
  }
  if (isPrivateIpv4(hostname)) return true;
  if (hostname.includes(':')) {
    return (
      hostname === '::'
      || hostname === '::1'
      || hostname.startsWith('fc')
      || hostname.startsWith('fd')
      || /^fe[89ab]/.test(hostname)
      || hostname.includes('::ffff:127.')
      || hostname.includes('::ffff:10.')
      || hostname.includes('::ffff:192.168.')
    );
  }
  return false;
}

function validateHttpsUrl(value: string): string | null {
  if (!value) return '请填写公开网页的 HTTPS 地址。';
  if (value.length > 1000) return '网址不能超过 1000 个字符。';
  if (containsUnsafeText(value) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) {
    return '网址包含不可见控制字符，无法生成草稿。';
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return '只接受 HTTPS 公开网址。';
    if (parsed.username || parsed.password) return '网址不能包含用户名或密码。';
    if (isPrivateHostname(parsed.hostname)) return '不接受 localhost、内网或保留地址。';
    return null;
  } catch {
    return '网址格式无法识别，请粘贴完整的 HTTPS 地址。';
  }
}

function validateText(label: string, value: string, maximum: number): string | null {
  if (!value.trim()) return `请填写${label}。`;
  if (value.length > maximum) return `${label}不能超过 ${maximum} 个字符。`;
  if (containsUnsafeText(value)) return `${label}包含不可见控制字符，无法生成草稿。`;
  return null;
}

export function PublicLocatorBuilder({ missionId }: { missionId: string }) {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [payload, setPayload] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const alertRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors([]);
    setPayload('');
    setCopyState('idle');
  }

  function focusErrors(messages: string[]) {
    setErrors(messages);
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  function buildDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: string[] = [];
    if (!leadKinds.some((option) => option.value === draft.leadKind)) {
      nextErrors.push('请选择线索类型。');
    }
    if (!observationScopes.some((option) => option.value === draft.observationScope)) {
      nextErrors.push('请选择你实际看到了什么。');
    }
    const urlError = validateHttpsUrl(draft.url.trim());
    if (urlError) nextErrors.push(urlError);
    for (const error of [
      validateText('资料标题', draft.sourceTitle, 180),
      validateText('馆藏号或目录号', draft.archiveOrCatalogId, 160),
    ]) {
      if (error) nextErrors.push(error);
    }
    const locatorParts = [draft.page, draft.frame, draft.issue];
    if (locatorParts.every((value) => !value.trim())) {
      nextErrors.push('页码、物理帧或期号至少填写一项。');
    }
    for (const [label, value] of [
      ['页码', draft.page],
      ['物理帧', draft.frame],
      ['期号', draft.issue],
    ] as const) {
      if (value.length > 60) nextErrors.push(`${label}不能超过 60 个字符。`);
      if (containsUnsafeText(value)) nextErrors.push(`${label}包含不可见控制字符。`);
    }
    if (!draft.publicOnly) nextErrors.push('请确认这条线索只来自公开页面。');
    if (!draft.authorityToShare) nextErrors.push('请确认你有权分享这个公开定位信息。');

    if (nextErrors.length > 0) {
      focusErrors(nextErrors);
      return;
    }

    const nextPayload = {
      mission_id: missionId,
      lead_kind: draft.leadKind,
      observation_scope: draft.observationScope,
      url: new URL(draft.url.trim()).toString(),
      source_title: draft.sourceTitle.trim(),
      archive_or_catalog_id: draft.archiveOrCatalogId.trim(),
      page: draft.page.trim(),
      frame: draft.frame.trim(),
      issue: draft.issue.trim(),
      public_only: true,
      authority_to_share: true,
      consent_version: 'archive-lead-draft-v1',
    };
    setErrors([]);
    setPayload(JSON.stringify(nextPayload, null, 2));
  }

  async function copyPayload() {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  function clearDraft() {
    setDraft(initialDraft);
    setErrors([]);
    setPayload('');
    setCopyState('idle');
  }

  return (
    <section className="border border-foreground/15 bg-card p-6 sm:p-8" aria-labelledby="locator-builder-title">
      <div className="flex flex-col gap-5 border-b border-foreground/15 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="story-kicker">公开线索草稿</p>
          <h2 id="locator-builder-title" className="mt-3 font-serif text-2xl font-semibold tracking-[-0.035em]">
            把一个公开定位整理成可核对的 JSON
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
            这里只生成本页草稿，不提交、不保存、不抓取网址，也不会创建历史主张。刷新页面即清空。
          </p>
        </div>
        <div className="shrink-0 border border-primary/25 bg-primary/5 px-3 py-2 text-xs leading-6 text-primary">
          <code>locator_intake_not_open</code><br />
          <code>creates_claim=false</code>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 border-l-2 border-primary bg-[#eee8dc] p-4 text-sm leading-[1.7]">
        <ShieldAlert className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          不要填写家属原件、私人通信、身份证件、联系方式或任何需要登录才能看到的地址。
          本工具只整理公开网页中的目录、页码、物理帧和期号。
        </p>
      </div>

      {errors.length > 0 && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mt-6 border border-destructive/35 bg-destructive/5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <p className="font-semibold text-destructive">草稿还不能生成：</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-destructive">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={buildDraft} className="mt-7 grid min-w-0 gap-6">
        <label className="grid min-w-0 gap-2 text-sm font-medium">
          对应任务
          <input
            value={missionId}
            readOnly
            aria-readonly="true"
            className="min-h-11 w-full min-w-0 border border-foreground/15 bg-muted px-3 text-sm text-muted-foreground outline-none"
          />
        </label>

        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            线索类型
            <select
              value={draft.leadKind}
              onChange={(event) => update('leadKind', event.target.value as LeadKind | '')}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
              required
            >
              <option value="">请选择</option>
              {leadKinds.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            你实际看到了什么
            <select
              value={draft.observationScope}
              onChange={(event) => update('observationScope', event.target.value as ObservationScope | '')}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
              required
            >
              <option value="">请选择</option>
              {observationScopes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <label className="grid min-w-0 gap-2 text-sm font-medium">
          HTTPS 公开网址
          <input
            type="url"
            inputMode="url"
            value={draft.url}
            onChange={(event) => update('url', event.target.value)}
            placeholder="https://example.org/catalog/item"
            maxLength={1000}
            className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/55 focus:border-primary"
            required
          />
          <span className="text-xs font-normal leading-6 text-muted-foreground">不会打开或抓取这个网址；localhost、内网、含账号密码的地址会被拒绝。</span>
        </label>

        <div className="grid min-w-0 gap-5 md:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            资料标题
            <input
              value={draft.sourceTitle}
              onChange={(event) => update('sourceTitle', event.target.value)}
              maxLength={180}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
              required
            />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            馆藏号或目录号
            <input
              value={draft.archiveOrCatalogId}
              onChange={(event) => update('archiveOrCatalogId', event.target.value)}
              maxLength={160}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
              required
            />
          </label>
        </div>

        <fieldset className="min-w-0 border border-foreground/15 p-4 sm:p-5">
          <legend className="px-2 text-sm font-semibold">明确定位（至少填写一项）</legend>
          <div className="grid min-w-0 gap-4 sm:grid-cols-3">
            {([
              ['page', '页码', '例如：285—296'],
              ['frame', '物理帧', '例如：72—74'],
              ['issue', '期号', '例如：6(1)'],
            ] as const).map(([key, label, placeholder]) => (
              <label key={key} className="grid min-w-0 gap-2 text-sm font-medium">
                {label}
                <input
                  value={draft[key]}
                  onChange={(event) => update(key, event.target.value)}
                  placeholder={placeholder}
                  maxLength={60}
                  className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/55 focus:border-primary"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3">
          <label className="flex min-h-11 items-start gap-3 text-sm leading-[1.7]">
            <input
              type="checkbox"
              checked={draft.publicOnly}
              onChange={(event) => update('publicOnly', event.target.checked)}
              className="mt-1.5 size-4 shrink-0 accent-primary"
              required
            />
            <span>我确认这条定位只来自无需登录即可访问的公开页面（<code>public_only=true</code>）。</span>
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-[1.7]">
            <input
              type="checkbox"
              checked={draft.authorityToShare}
              onChange={(event) => update('authorityToShare', event.target.checked)}
              className="mt-1.5 size-4 shrink-0 accent-primary"
              required
            />
            <span>我确认有权分享这个公开定位信息（<code>authority_to_share=true</code>）。</span>
          </label>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          同意版本：<code>archive-lead-draft-v1</code>。当前没有服务端接收接口，生成的 JSON 需由你自行保管。
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="submit" className="story-button story-button-primary">
            <FileJson2 className="size-4" aria-hidden="true" />
            生成本地 JSON 草稿
          </button>
          <button type="button" onClick={clearDraft} className="story-button story-button-secondary">
            <RotateCcw className="size-4" aria-hidden="true" />
            清空本页草稿
          </button>
        </div>
      </form>

      {payload && (
        <div className="mt-8 border-t border-foreground/15 pt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">JSON 已在本页生成</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">没有发送到服务器；刷新后将消失。</p>
            </div>
            <button type="button" onClick={copyPayload} className="story-button story-button-secondary">
              {copyState === 'copied'
                ? <Check className="size-4" aria-hidden="true" />
                : <ClipboardCopy className="size-4" aria-hidden="true" />}
              {copyState === 'copied' ? '已复制' : '复制 JSON'}
            </button>
          </div>
          <pre className="mt-5 max-w-full overflow-x-auto border border-foreground/15 bg-[#202827] p-4 text-xs leading-6 text-[#f3efe7]">
            {payload}
          </pre>
          {copyState === 'failed' && (
            <p className="mt-3 text-sm text-destructive" role="status">浏览器未允许复制，请手动选择上面的 JSON。</p>
          )}
        </div>
      )}
    </section>
  );
}
