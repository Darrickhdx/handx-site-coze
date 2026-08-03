import type { Metadata } from 'next';
import { SiteStatusDashboard } from '@/components/site-status-dashboard';

export const metadata: Metadata = {
  title: '数据版本与服务状态｜Handx web0.1',
  description: '分开查看苏开元项目的数据代次、产品构建、权利门槛与本地服务开关，不展示历史研究完成率。',
};

export default function DataVersionsPage() {
  return <SiteStatusDashboard />;
}
