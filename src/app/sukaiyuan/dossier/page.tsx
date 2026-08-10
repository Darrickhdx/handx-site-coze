import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Files, Fingerprint, Route } from 'lucide-react';
import { IdentityDossier } from '@/components/identity-dossier';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { identityDossierItems } from '@/content/identity-dossier';

export const metadata: Metadata = {
  title: '蘇開元与蘇凱元，是同一个人吗？｜一个名字的历史踪迹',
  description: '沿1929、1933、1936、1937与1942的六份材料，比较苏开元姓名、籍贯、学籍和军职记录，理解当前身份结论与未解问题。',
};

export default function SuKaiyuanDossierPage() {
  return (
    <div className="overflow-hidden bg-background">
      <ProjectSectionNav />
      <header className="border-b border-foreground/15">
        <div className="personal-shell py-9 sm:py-10">
          <Link href="/sukaiyuan" className="story-text-link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回苏开元计划
          </Link>
          <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(28rem,1.12fr)] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                一个名字的历史踪迹
              </p>
              <h1 className="personal-display mt-7 text-[clamp(1.54rem,3.07vw,3.07rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
                蘇開元与蘇凱元，
                <br />
                是同一个人吗？
              </h1>
            </div>
            <div>
              <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-xl">
                蘇開元、蘇凱元、Su Kai-yuan。
                <br />
                名字越来越像，证据却必须一格一格对齐。
              </p>
              <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
                用约三分钟比对六份材料。先认识两条姓名轨，再查看每张纸写了什么、不能证明什么，以及为什么当前仍保留一道身份问题。
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#dossier-start" className="story-button story-button-primary">
                  开始比对 6 份材料
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href="#dossier-verdict" className="story-button story-button-secondary">
                  直接看当前结论
                </a>
              </div>
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                约 3 分钟 · 选择不会改变史料状态或项目结论
              </p>
              <div className="mt-8 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
                <div className="bg-background p-4">
                  <Files className="size-4 text-primary" aria-hidden="true" />
                  <strong className="mt-3 block font-serif text-2xl">{identityDossierItems.length}</strong>
                  <span className="text-xs text-muted-foreground">份来源卡</span>
                </div>
                <div className="bg-background p-4">
                  <Fingerprint className="size-4 text-primary" aria-hidden="true" />
                  <strong className="mt-3 block font-serif text-2xl">3</strong>
                  <span className="text-xs text-muted-foreground">种姓名写法</span>
                </div>
                <div className="bg-background p-4">
                  <Route className="size-4 text-primary" aria-hidden="true" />
                  <strong className="mt-3 block font-serif text-2xl">1</strong>
                  <span className="text-xs text-muted-foreground">条候选身份桥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <IdentityDossier />
    </div>
  );
}
