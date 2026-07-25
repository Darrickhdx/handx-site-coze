'use client';

import Link from 'next/link';
import { Check, Copy, ExternalLink, Link2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { ArticleRightsPassport } from '@/content/publication-rights';

interface ArticleRightsPassportProps {
  passport: ArticleRightsPassport;
  title: string;
}

type CopyState = 'idle' | 'citation';

function isExternalLink(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // The local preview or an embedded browser can deny Clipboard API
      // permission even after a user click. Fall through to a temporary
      // textarea so the visible copy action still works.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.inset = '-9999px auto auto -9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

export function ArticleRightsPassportCard({
  passport,
  title,
}: ArticleRightsPassportProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  async function copyValue(value: string, state: CopyState): Promise<void> {
    try {
      const copied = await copyText(value);
      if (!copied) throw new Error('copy_failed');
      setCopyState(state);
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('idle');
    }
  }

  const shareText = [
    `作者：${passport.author}`,
    `文章：《${title}》`,
    '出处：鉴真小秃驴个人网站',
    '原文：公开链接待启用',
    `权利身份证：${passport.rightsId}`,
    '权利状态：版权所有，保留所有权利；当前未发放 CC 或其他开放许可。',
    '',
    '复制这段署名信息不代表取得转载许可。',
  ].join('\n');

  return (
    <section className="article-rights-passport" aria-labelledby="article-rights-heading">
      <div className="article-rights-heading-row">
        <div>
          <p className="article-rights-kicker">Rights passport · 权利护照</p>
          <h2 id="article-rights-heading">转发原文，也把作者与来源一起带走。</h2>
        </div>
        <span className="article-rights-status">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {passport.rightsId} · {passport.statusLabel}
        </span>
      </div>

      <div className="article-rights-grid">
        <div>
          <p className="article-rights-label">原创责任</p>
          <p className="article-rights-value">{passport.author}</p>
          <p className="article-rights-note">{passport.authorRole}</p>
        </div>
        <div>
          <p className="article-rights-label">版本</p>
          <p className="article-rights-value">{passport.version}</p>
          <p className="article-rights-note">{passport.originalRights}</p>
          <p className="article-rights-note">
            版权所有，保留所有权利；当前未发放 CC 或其他开放许可。
          </p>
        </div>
      </div>

      <div className="article-rights-rules">
        {[passport.linkSharing, passport.quotationRule, passport.permissionRequired].map((rule) => (
          <p key={rule}>
            <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{rule}</span>
          </p>
        ))}
      </div>

      <div className="article-rights-boundaries">
        <p>{passport.historicalFactsBoundary}</p>
        <p>{passport.commercialFictionBoundary}</p>
      </div>

      <div className="article-rights-actions">
        <button
          type="button"
          onClick={() => void copyValue(shareText, 'citation')}
          className="story-button personal-button-primary"
          data-amplitude-event="article_attribution_copied"
          data-amplitude-story={passport.slug}
        >
          {copyState === 'citation'
            ? <Check className="size-4" aria-hidden="true" />
            : <Copy className="size-4" aria-hidden="true" />}
          {copyState === 'citation' ? '署名信息已复制' : '复制规范署名'}
        </button>
        <button
          type="button"
          disabled
          className="story-button article-rights-secondary"
          title="当前只有本地审阅地址，不能把 127.0.0.1 当成公开原文链接"
        >
          <Link2 className="size-4" aria-hidden="true" />
          正式公开后启用链接
        </button>
        <Link href="/rights" className="story-text-link">
          查看完整转载规则
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="article-rights-copy-warning" aria-live="polite">
        {copyState === 'citation'
          ? '已复制署名格式；这不会产生转载许可。'
          : '分享链接无需申请；全文或实质性转载仍须书面许可。仅注明来源不等于取得许可。'}
      </p>

      <div className="article-source-credits">
        <p className="article-rights-label">本文使用的原作者与来源</p>
        <p className="article-rights-note">{passport.sourceBoundary}</p>
        <div className="mt-5 border-t border-foreground/15">
          {passport.sourceCredits.map((source) => {
            const content = (
              <>
                <span className="article-source-id">{source.sourceId}</span>
                <span className="article-source-credit-copy">
                  <strong>{source.creator} · {source.title}</strong>
                  <span>{source.publisher} · {source.date}</span>
                  <span>{source.relationship}</span>
                </span>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              </>
            );

            return isExternalLink(source.href) ? (
              <a
                key={source.sourceId}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="article-source-credit"
                data-amplitude-event="article_source_credit_opened"
                data-amplitude-source-id={source.sourceId}
                data-amplitude-story={passport.slug}
              >
                {content}
              </a>
            ) : (
              <Link
                key={source.sourceId}
                href={source.href}
                className="article-source-credit"
                data-amplitude-event="article_source_credit_opened"
                data-amplitude-source-id={source.sourceId}
                data-amplitude-story={passport.slug}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {passport.thirdPartyMaterials.length > 0 && (
        <div className="article-third-party-materials">
          <p className="article-rights-label">嵌入材料的独立权利状态</p>
          {passport.thirdPartyMaterials.map((material) => (
            <article key={material.materialId}>
              <span>{material.materialId} · {material.publishability}</span>
              <strong>{material.creator} · {material.workTitle}</strong>
              <p>{material.locator}；{material.displayScope}。</p>
              <p>{material.reuseNotice}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
