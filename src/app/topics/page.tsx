import Link from 'next/link';
import {
  ArrowRight,
  FileQuestion,
  FlaskConical,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  getMediaEligibleTopicParagraphs,
  getTopicParagraphs,
  topicArticles,
} from '@/content/topics';

const laboratoryRules = [
  {
    icon: FileQuestion,
    title: '问题先于结论',
    description: '把“谁更重要”拆成身份、来源、时间与公开机制等可证伪问题。',
  },
  {
    icon: Waypoints,
    title: '每段都能回溯',
    description: '史实、提问与解释分开标记；主张编号和来源编号不会藏在文末。',
  },
  {
    icon: ShieldCheck,
    title: '传播不越过证据',
    description: '未核政治身份、真人关键因果和 Legacy 线索不会进入媒体素材包。',
  },
] as const;

export default function TopicsPage() {
  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />
      <section className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell grid gap-10 py-16 sm:py-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)] lg:items-end lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 border border-[#c38a82]/40 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#dbb6b0] uppercase">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              Topic laboratory
            </p>
            <h1 className="mt-8 font-serif text-[clamp(1.46rem,2.84vw,2.84rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
              历史话题
              <span className="block text-[#c38a82]">实验室</span>
            </h1>
          </div>
          <div>
            <p className="font-serif text-lg leading-relaxed text-[#e1dbd1] sm:text-base">
              好话题不是把结论喊得更响，
              <br />
              而是让读者看见结论从哪里来。
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-[1.7] text-[#bdb9b0]">
              这里把容易引发讨论的人物比较、历史空白和传播命题，
              改写成带有证据边界的公开议题。当前全部内容仍是本地审阅稿。
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-px bg-foreground/15 md:grid-cols-3">
          {laboratoryRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <article key={rule.title} className="bg-[#f4f0e8] p-7 sm:p-9">
                <Icon className="size-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <h2 className="mt-8 font-serif text-xl font-semibold">{rule.title}</h2>
                <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                  {rule.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col gap-4 border-b border-foreground/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="story-kicker">当前专题</p>
              <h2 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.04em] sm:text-2xl">
                从一篇有争议的比较开始
              </h2>
            </div>
            <p className="max-w-md text-xs leading-6 text-muted-foreground">
              原始草稿只作为问题来源，不作为事实来源。下列版本已经移除功劳排名和未经核验的真人关键因果。
            </p>
          </div>

          <div className="divide-y divide-foreground/15">
            {topicArticles.map((topic, index) => {
              const paragraphs = getTopicParagraphs(topic);
              const mediaEligible = getMediaEligibleTopicParagraphs(topic);
              return (
                <article
                  key={topic.slug}
                  className="grid gap-8 py-7 lg:grid-cols-[5rem_minmax(0,1fr)_14rem] lg:items-start lg:gap-10 lg:py-10"
                >
                  <span className="font-serif text-2xl italic text-primary/25">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                      {topic.eyebrow}
                    </p>
                    <h3 className="mt-4 max-w-4xl font-serif text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-xl">
                      {topic.title}
                    </h3>
                    <p className="mt-5 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
                      {topic.dek}
                    </p>
                    <Link
                      href={`/topics/${topic.slug}`}
                      className="story-text-link mt-7"
                    >
                      打开专题
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <dl className="grid gap-4 border-l border-foreground/15 pl-5 text-xs">
                    <div>
                      <dt className="text-muted-foreground">段落合同</dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {paragraphs.length} 条
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">可进入审稿包</dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {mediaEligible.length} 条
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">状态</dt>
                      <dd className="mt-1 font-semibold text-[#8c6d2b]">本地审阅</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-white/25 py-7 sm:py-10">
        <div className="personal-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div>
            <p className="story-kicker">传播出口</p>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.035em] sm:text-xl">
              先过边界检查，再生成平台素材。
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-[1.7] text-muted-foreground">
              媒体工作台只读取允许进入传播审稿的段落，并把事实、解释和文学内容分开标注。
            </p>
          </div>
          <Link href="/studio/media" className="story-button story-button-primary">
            进入媒体工作台
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
