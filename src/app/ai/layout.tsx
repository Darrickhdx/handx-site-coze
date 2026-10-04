import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 与产品实践',
  description: '鉴真小秃驴的 AI 产品与软硬件实践：日本售货机移动支付、智能运营、信息研究与知识管理、视觉边缘计算及设施数字化。',
};

export default function AiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
