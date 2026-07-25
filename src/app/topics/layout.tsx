import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '历史话题实验室',
  description:
    '从可定位来源出发，把人物比较改写成可以继续核对的历史问题。',
};

export default function TopicsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
