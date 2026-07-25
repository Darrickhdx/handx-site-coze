import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '寻找苏开元',
  description:
    '一个普通人，如何穿过一个大时代。从 1936 年朱自清《绥行纪略》中的同名记录开始，连接家族记忆、历史材料与未解问题。',
};

export default function SuKaiyuanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
