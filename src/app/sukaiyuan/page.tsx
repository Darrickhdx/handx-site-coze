import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenText,
  FileSearch,
  Mail,
  Quote,
  UsersRound,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { peopleDossiers } from '@/content/people-dossiers';
import { suKaiyuanArchiveGroups } from '@/content/site';
import { graphManifest } from '@/lib/graph-wiki-data';

export default function SuKaiyuanPage() {
  const supportingPeople = peopleDossiers.filter((person) => person.entityId !== 'P-001');

  return (
    <div className="story-home overflow-hidden">
      <ProjectSectionNav />

      <section className="sukaiyuan-hero border-b border-white/10 text-[#f3efe7]">
        <div className="story-shell grid min-h-[21rem] gap-12 py-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(31rem,1.12fr)] lg:items-start lg:gap-14 lg:py-14">
          <div className="relative z-10 max-w-[45rem]">
            <div className="sukaiyuan-project-label">
              <span>家族史旗舰项目</span>
              <strong>01</strong>
            </div>
            <h1 className="sukaiyuan-title mt-7">寻找苏开元</h1>
            <p className="mt-4 font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
              一行旧字，把我带回曾祖父的名字。
            </p>
            <p className="mt-6 max-w-2xl text-base leading-[1.8] text-[#bdb9b0] sm:text-lg">
              1936 年，一位作家在边地的一次会场里写下“留守司令蘇開元團長”。九十年后，
              这行字把我带回一个家族问题：被写下的人，究竟是不是我的曾祖父？
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-[1.8] text-[#aaa69f]">
              我还不能替历史下结论；但我想带你去看，为什么这行字值得继续寻找。
            </p>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/discover/1936-pingdiquan"
                data-amplitude-event="sukaiyuan_story_started"
                className="story-button personal-button-light"
              >
                从1936年的一行字开始
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/archives/SRC-013"
                data-amplitude-event="sukaiyuan_original_opened"
                data-amplitude-source-id="SRC-013"
                className="personal-dark-link"
              >
                先看这一页原件
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-7 grid gap-px overflow-hidden border border-white/15 bg-white/15 text-xs leading-6 sm:grid-cols-3">
              <div className="bg-[#1d2524] p-4">
                <strong className="block text-[#f3efe7]">一行名字</strong>
                <p className="mt-2 text-[#aaa69f]">1936 年 11 月 21 日，出现在校刊里。</p>
              </div>
              <div className="bg-[#1d2524] p-4">
                <strong className="block text-[#f3efe7]">一个地点</strong>
                <p className="mt-2 text-[#aaa69f]">平地泉，一次公开会面的现场。</p>
              </div>
              <div className="bg-[#1d2524] p-4">
                <strong className="block text-[#f3efe7]">一个问题</strong>
                <p className="mt-2 text-[#aaa69f]">这位“蘇開元”，是不是我的曾祖父？</p>
              </div>
            </div>
          </div>

          <aside className="sukaiyuan-document-stage" aria-label="朱自清《绥行纪略》同期影印件">
            <div className="sukaiyuan-document-meta">
              <p>故事从这里开始 · 1936</p>
              <span className="sukaiyuan-document-type">
                《国立清华大学校刊》第 792 号 · 第三方影印局部
              </span>
            </div>
            <Link href="/discover/1936-pingdiquan" className="sukaiyuan-document-sheet group">
              <Image
                src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
                alt="朱自清《绥行纪略》同期校刊影印局部，文中可见留守司令苏开元团长的文字记录"
                width={1835}
                height={1035}
                className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.015]"
                sizes="(min-width: 1024px) 52vw, 100vw"
                priority
              />
              <span className="sukaiyuan-document-action">
                读懂这份原件
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
            <p className="mt-3 text-[11px] leading-5 tracking-wide text-[#aaa69f]">
              第三方史料局部仅供本地研究审阅，不随本站文章授权。
            </p>
            <blockquote className="sukaiyuan-hero-quote">
              <Quote className="size-5 shrink-0 text-[#c38a82]" strokeWidth={1.5} aria-hidden="true" />
              <span>“早飯後，至第二師範，適平地泉各界自衛會在此開會，遇留守司令蘇開元團長。”</span>
            </blockquote>
          </aside>
        </div>
      </section>

      <section id="pingdiquan" className="scroll-mt-32 border-b border-foreground/15 py-12 sm:py-16">
        <div className="story-shell grid gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Start with a story
            </p>
            <p className="mt-8 font-serif text-6xl italic text-primary/25">1936</p>
          </div>
          <div className="max-w-4xl">
            <p className="story-kicker">第一站 · 平地泉</p>
            <h2 className="story-heading mt-4">朱自清在平地泉遇见了谁？</h2>
            <div className="mt-8 max-w-3xl space-y-5 text-lg leading-9 text-muted-foreground">
              <p>
                1936 年 11 月 21 日，朱自清在《绥行纪略》中记下：
                他在平地泉遇到“留守司令苏开元团长”。这行文字让一个姓名重新出现在确切的日期、地点与版面中。
              </p>
              <p>
                但它没有告诉我们，这个人是不是我的曾祖父。完整专题会带你看原文、现场背景、能够确认的事实，
                以及为什么研究必须停在尚未证明的地方。
              </p>
            </div>
            <Link href="/discover/1936-pingdiquan" className="story-button story-button-primary mt-9">
              阅读完整故事
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-[#eee9df] py-16 sm:py-14">
        <div className="story-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              一个名字的历史踪迹
            </p>
            <p className="mt-8 font-serif text-5xl italic text-primary/25">開／凱</p>
          </div>
          <div>
            <p className="story-kicker">第二站 · 身份连接</p>
            <h2 className="story-heading mt-4">蘇開元与蘇凱元，是同一个人吗？</h2>
            <p className="mt-7 max-w-3xl text-lg leading-9 text-muted-foreground">
              同县、同校、同科，1935 年两种姓名的中校记录又只差一天。六份材料形成了一条很强的候选身份桥，
              却仍缺少原始学籍、军籍号或明确异名字段。你可以逐份查看原件能够证明什么，再对照项目的固定判断。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sukaiyuan/dossier" className="story-button story-button-primary">
                开始三分钟比对
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/discover/same-name" className="story-button story-button-secondary">
                先读同名专题
              </Link>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              互动选择只记录你的阅读过程，不改变史料状态，也不参与历史事实判定。
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-12 sm:py-16">
        <div className="story-shell">
          <div className="grid gap-8 border-b border-foreground/15 pb-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />People constellation</p>
              <UsersRound className="mt-7 size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="personal-heading mt-6">一个人身后，是一群人。</h2>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-[1.8] text-muted-foreground">
                李英夫留下证词，李大超带来同名谜团，朱自清记录现场，乔培新让“谍战感”必须接受证据约束，傅作义代表不能被主角取代的公共历史。
              </p>
              <Link href="/persons" className="story-text-link mt-5">
                进入完整人物群像 <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="grid gap-px border-x border-b border-foreground/15 bg-foreground/15 sm:grid-cols-2 xl:grid-cols-5">
            {supportingPeople.map((person) => (
              <Link key={person.entityId} href={`/persons/${person.entityId}`} className="group flex min-h-72 flex-col bg-background p-6 hover:bg-card">
                <span className="grid size-14 place-items-center border border-primary/30 bg-primary/5 font-serif text-2xl text-primary" aria-hidden="true">{person.initials}</span>
                <p className="mt-7 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">{person.eyebrow}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold">{person.displayName}</h3>
                <p className="mt-4 text-xs leading-6 text-muted-foreground">{person.roleInStory}</p>
                <span className="story-text-link mt-auto pt-6">打开档案 <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="archive" className="scroll-mt-32 py-12 sm:py-16">
        <div className="story-shell">
          <div className="grid gap-8 border-b border-foreground/15 pb-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Research archive
              </p>
              <h2 className="personal-heading mt-6">故事之后，想深挖的人再走进资料库。</h2>
            </div>
            <div>
              <p className="max-w-2xl text-base leading-[1.8] text-muted-foreground">
                图谱负责看关系，Wiki 负责认识人物，原件库负责把你带回那一页纸。
                它们不是阅读门槛，而是故事之后可以继续探索的三扇门。
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                当前研究快照：{graphManifest.counts.audit_nodes} 个实体 · {graphManifest.counts.audit_claims} 条主张 · {graphManifest.counts.audit_sources} 份来源
              </p>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden border-x border-b border-foreground/15 bg-foreground/15 sm:grid-cols-2 xl:grid-cols-4">
            {suKaiyuanArchiveGroups.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-[18rem] flex-col bg-background p-7 transition-colors hover:bg-card sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl italic text-primary/30">0{index + 1}</span>
                    <Icon className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
                  </div>
                  <h3 className="mt-12 font-serif text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">{item.description}</p>
                  <span className="story-text-link mt-auto">
                    {item.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/topics" className="underline decoration-foreground/20 underline-offset-4 hover:text-primary">
              查看研究专题
            </Link>
            <Link href="/timeline" className="underline decoration-foreground/20 underline-offset-4 hover:text-primary">
              查看断片时间线
            </Link>
            <Link href="/controversies" className="underline decoration-foreground/20 underline-offset-4 hover:text-primary">
              查看仍未解决的问题
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#eee9df] py-12 sm:py-16">
        <div className="story-shell grid gap-14 lg:grid-cols-[minmax(27rem,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
          <Link href="/novel" className="fiction-home-image group">
            <Image
              src="/assets/editorial/fiction-north-city-collage-v1.png"
              alt="虚构北城雪夜、旧纸、空椅与缺页账簿组成的抽象小说概念拼贴"
              width={1586}
              height={992}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.012]"
              sizes="(min-width: 1024px) 52vw, 100vw"
            />
            <span>AI 艺术想象 · 不是历史照片</span>
          </Link>

          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Literary extension
            </p>
            <BookOpenText className="mt-8 size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">《英雄无名》：让空白变成文学，但不冒充历史。</h2>
            <p className="mt-7 max-w-xl text-base leading-[1.8] text-muted-foreground">
              小说以真实时代和已核材料为骨架，对话、行动细节与部分人物关系属于合理外推或纯虚构。
              读者可以阅读 182 页、32 章全文；小说内容不会反向进入研究图谱。
            </p>
            <div className="mt-7 border-l-2 border-primary pl-5 text-sm leading-[1.8] text-muted-foreground">
              历史研究回答“目前知道什么”；小说追问“一个人在不知道结局时，会怎样选择”。
            </div>
            <Link href="/novel" className="story-button story-button-primary mt-9">
              进入全文阅读
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="story-shell grid overflow-hidden border border-foreground/15 bg-card lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-7 sm:p-10 lg:p-12">
            <div className="flex size-11 items-center justify-center rounded-full border border-primary/25 text-primary">
              <FileSearch className="size-5" aria-hidden="true" />
            </div>
            <h2 className="story-heading mt-7 max-w-3xl">你手里也许就有下一块拼图。</h2>
            <p className="mt-6 max-w-2xl text-base leading-[1.8] text-muted-foreground">
              如果你知道苏开元、李英夫、李大超，或掌握相关部队、地点和档案线索，欢迎提供来源标题、年代、馆藏、档号与页码。
              家属原件和私人材料默认不公开。
            </p>
          </div>
          <div className="flex flex-col gap-3 border-t border-foreground/15 p-7 lg:min-w-72 lg:border-l lg:border-t-0 lg:p-9">
            <Link href="/about#contact" className="story-button story-button-primary">
              提供线索
              <Mail className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/about" className="story-text-link">
              认识项目发起人
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
