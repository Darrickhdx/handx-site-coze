import type { Metadata } from 'next';
import { ResearchMissionAdmin } from '@/components/research-mission-admin';

export const metadata: Metadata = {
  title: '史料行动执行台｜Handx web0.1',
  description: '站主本机专用的 33 项查档与实地调研行动基线，只读展示，不代表历史研究完成率。',
};

export default function ResearchMissionAdminPage() {
  return <ResearchMissionAdmin />;
}
