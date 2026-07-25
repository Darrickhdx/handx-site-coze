import type { Metadata } from 'next';
import { NovelCommentAdmin } from '@/components/novel-comment-admin';

export const metadata: Metadata = {
  title: '小说评论审核｜Handx web0.1',
  description: '本机管理员专用的《英雄无名》章节评论审核队列。',
};

export default function NovelCommentAdminPage() {
  return <NovelCommentAdmin />;
}
