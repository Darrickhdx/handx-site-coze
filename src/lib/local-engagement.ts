const sessionStorageKey = 'jian-zhen-local-session';
const acquisitionStorageKey = 'jian-zhen-local-acquisition-v2';

type AnalyticsProperties = Record<string, string>;
export type AcquisitionChannel =
  | 'direct'
  | 'internal'
  | 'wechat'
  | 'xiaohongshu'
  | 'douyin'
  | 'zhihu'
  | 'weibo'
  | 'search'
  | 'newsletter'
  | 'qr'
  | 'other_referral';

interface AcquisitionProperties {
  acquisition_channel: AcquisitionChannel;
  campaign_id?: string;
}

const allowedChannels = new Set<AcquisitionChannel>([
  'direct',
  'internal',
  'wechat',
  'xiaohongshu',
  'douyin',
  'zhihu',
  'weibo',
  'search',
  'newsletter',
  'qr',
  'other_referral',
]);

const allowedCampaigns = new Set([
  'pingdiquan-01',
  'same-name-01',
  'ai-family-history-01',
  'personal-home-01',
  'studio-beta-01',
]);

interface NavigatorWithPrivacyControl extends Navigator {
  globalPrivacyControl?: boolean;
}

function trackingIsDisabled(): boolean {
  if (typeof navigator === 'undefined') return true;
  const privacyNavigator = navigator as NavigatorWithPrivacyControl;
  return privacyNavigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

export function getLocalSessionId(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.sessionStorage.getItem(sessionStorageKey);
  if (existing) return existing;

  const generated = typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  window.sessionStorage.setItem(sessionStorageKey, generated);
  return generated;
}

function hostnameMatches(hostname: string, domains: readonly string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function classifyReferrer(): AcquisitionChannel {
  if (!document.referrer) return 'direct';

  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) return 'internal';
    const hostname = referrer.hostname.toLowerCase();
    if (
      hostnameMatches(hostname, [
        'weixin.qq.com',
        'xweixin.qq.com',
        'mp.weixin.qq.com',
        'weixin110.qq.com',
      ])
    ) {
      return 'wechat';
    }
    if (hostnameMatches(hostname, ['xiaohongshu.com', 'xhslink.com'])) return 'xiaohongshu';
    if (hostnameMatches(hostname, ['douyin.com', 'iesdouyin.com'])) return 'douyin';
    if (hostnameMatches(hostname, ['zhihu.com'])) return 'zhihu';
    if (hostnameMatches(hostname, ['weibo.com', 'weibo.cn'])) return 'weibo';
    if (
      hostnameMatches(hostname, [
        'baidu.com',
        'bing.com',
        'google.com',
        'google.com.hk',
        'sogou.com',
        'so.com',
      ])
    ) {
      return 'search';
    }
    return 'other_referral';
  } catch {
    return 'other_referral';
  }
}

export function getAcquisitionProperties(): AcquisitionProperties {
  if (typeof window === 'undefined') return { acquisition_channel: 'direct' };

  const existing = window.sessionStorage.getItem(acquisitionStorageKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as Partial<AcquisitionProperties>;
      if (
        typeof parsed.acquisition_channel === 'string'
        && allowedChannels.has(parsed.acquisition_channel as AcquisitionChannel)
        && (
          parsed.campaign_id === undefined
          || allowedCampaigns.has(parsed.campaign_id)
        )
      ) {
        return parsed as AcquisitionProperties;
      }
    } catch {
      window.sessionStorage.removeItem(acquisitionStorageKey);
    }
  }

  const search = new URLSearchParams(window.location.search);
  const requestedChannel = search.get('ref');
  const channel = requestedChannel && allowedChannels.has(requestedChannel as AcquisitionChannel)
    ? requestedChannel as AcquisitionChannel
    : classifyReferrer();
  const requestedCampaign = search.get('campaign');
  const acquisition: AcquisitionProperties = {
    acquisition_channel: channel,
    ...(requestedCampaign && allowedCampaigns.has(requestedCampaign)
      ? { campaign_id: requestedCampaign }
      : {}),
  };
  window.sessionStorage.setItem(acquisitionStorageKey, JSON.stringify(acquisition));
  return acquisition;
}

export function sendLocalAnalytics(
  eventName: string,
  path: string,
  properties: AnalyticsProperties = {},
): void {
  if (trackingIsDisabled()) return;
  const sessionId = getLocalSessionId();
  if (!sessionId) return;

  const payload = JSON.stringify({
    event_name: eventName,
    path,
    session_id: sessionId,
    properties: {
      ...getAcquisitionProperties(),
      ...properties,
    },
  });

  if (typeof navigator.sendBeacon === 'function') {
    const accepted = navigator.sendBeacon(
      '/api/local/analytics',
      new Blob([payload], { type: 'application/json' }),
    );
    if (accepted) return;
  }

  void fetch('/api/local/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
