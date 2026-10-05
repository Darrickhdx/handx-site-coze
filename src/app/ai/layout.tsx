import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 与产品实践',
  description: '鉴真小秃驴的 AI、软硬件与日本业务实践：从现场需求、产品定义到验证与交付。PPS7700 商业化案例、智能运营试点准备，以及研究与创作成果。',
};

export default function AiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
