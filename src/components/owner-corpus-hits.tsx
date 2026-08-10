'use client';

import { useState } from 'react';
import { FileSearch, KeyRound, LoaderCircle, ShieldAlert } from 'lucide-react';

type CorpusHit = {
  document_id: string;
  title: string;
  suffix: string;
  material_class: string;
  access_tier: 'P1-owner-only';
  locators: string[];
};

type CorpusResponse = {
  ok: boolean;
  entity_id?: string;
  hits?: CorpusHit[];
  omitted_restricted?: number;
  generated_at?: string;
  error?: string;
};

export function OwnerCorpusHits({ entityId }: { entityId: string }) {
  const [token, setToken] = useState('');
  const [hits, setHits] = useState<CorpusHit[] | null>(null);
  const [omittedRestricted, setOmittedRestricted] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const loadHits = async () => {
    if (!token.trim()) {
      setStatus('error');
      setMessage('请输入本机管理员密钥。');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch(
        `/api/local/corpus-hits?entity=${encodeURIComponent(entityId)}`,
        {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token.trim()}` },
        },
      );
      const payload = (await response.json()) as CorpusResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error === 'index_not_available'
            ? '本机命中索引尚未生成。'
            : '密钥无效，或本机索引无法读取。',
        );
      }
      setHits(payload.hits ?? []);
      setOmittedRestricted(payload.omitted_restricted ?? 0);
      setToken('');
      setStatus('idle');
    } catch (error: unknown) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '读取失败。');
    }
  };

  return (
    <section className="mt-16 border border-foreground/15 bg-card p-5 sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <FileSearch className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold">主人资料命中索引</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
            这是只读检索结果，只显示 P1 文档标题、定位和材料类别。自动命中不会创建主张或关系；
            P2／P3 材料、正文和本机路径始终不会发送到浏览器。
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor={`corpus-token-${entityId}`}>
            本机管理员密钥
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`corpus-token-${entityId}`}
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void loadHits();
              }}
              className="min-h-11 min-w-0 flex-1 border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="private-runtime/admin-token"
            />
            <button
              type="button"
              onClick={() => void loadHits()}
              disabled={status === 'loading'}
              className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {status === 'loading' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              读取
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-xs text-destructive" role="alert">
          {message}
        </p>
      )}

      {hits !== null && (
        <div className="mt-7">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            返回 {hits.length} 项 P1 命中；另有 {omittedRestricted} 项受限命中未发送到浏览器。
          </p>
          {hits.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {hits.map((hit) => (
                <article key={hit.document_id} className="border border-foreground/15 bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-primary">{hit.document_id}</span>
                    <span className="text-[10px] text-muted-foreground">{hit.access_tier}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{hit.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {hit.material_class} · {hit.suffix || '无扩展名'}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    定位：{hit.locators.join('、')}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-3 border border-foreground/15 bg-background p-4">
              <ShieldAlert className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <p className="text-sm leading-6 text-muted-foreground">
                当前没有可返回的 P1 命中。受限材料是否存在，不会改变实体的证据状态。
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
