import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CircleDot,
  FileSearch,
  MapPin,
  Quote,
  Scale,
  UsersRound,
} from 'lucide-react';
import {
  dataMeta,
  eventRecords,
  sourceById,
} from '@/lib/research-data';
import { cn } from '@/lib/utils';

const officialFacsimile = sourceById.get('SRC-013');
const localTranscript = sourceById.get('SRC-002');

const archiveEntries = [
  {
    href: '/person',
    eyebrow: '人物档案',
    title: '苏开元：从已知记录开始',
    description: '查看三组同名材料、身份边界，以及哪些经历仍不能连成一条生平。',
    event: 'person_archive_opened',
  },
  {
    href: '/archives',
    eyebrow: '史料阅览室',
    title: '打开原件与来源说明',
    description: '查看载体关系、原文定位与公开入口；同源转录不会被重复计算。',
    event: 'evidence_archive_opened',
  },
  {
    href: '/controversies',
    eyebrow: '尚未解决',
    title: '我们还不知道什么',
    description: '不同年份的同名记录、史料空白与不能外推的内容都在这里明确保留。',
    event: 'open_questions_opened',
  },
] as const;

export default function HomePage() {
  return (
    <div className="story-home overflow-hidden">
      <section className="sukaiyuan-hero border-b border-white/10 text-[#f3efe7]">
        <div className="story-shell grid min-h-[calc(100svh-6.5rem)] items-center gap-14 py-14 lg:grid-cols-[minmax(0,0.84fr)_minmax(34rem,1.16fr)] lg:gap-16 lg:py-20">
          <div className="relative z-10 max-w-[45rem]">
            <div className="sukaiyuan-project-label">
              <span>旗舰项目</span>
              <strong>01</strong>
            </div>

            <h1 className="sukaiyuan-title mt-9">寻找苏开元</h1>
            <p className="mt-5 font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
              一个普通人，如何穿过一个大时代。
            </p>

            <p className="mt-8 max-w-2xl text-base leading-8 text-[#bdb9b0] sm:text-lg">
              一边是家族记忆中的曾祖父，一边是 1936 年朱自清笔下的“留守司令苏开元团长”。
              我们从这条同期记录出发，寻找二者之间能够被查证的连接。
            </p>

            <div className="sukaiyuan-research-status">
              <strong>研究状态</strong>
              <span>1936 年文献中出现该姓名和称谓，已经核对；与家族人物是否为同一人，尚未证实。</span>
              <Link href="/controversies">查看未解问题</Link>
            </div>

            <div className="sukaiyuan-years mt-10" aria-label="目前找到的三个文献年份">
              <span className="sukaiyuan-year"><strong>1933</strong> 公报任命记录</span>
              <span className="sukaiyuan-year is-focus"><strong>1936</strong> 平地泉记录</span>
              <span className="sukaiyuan-year"><strong>1942</strong> 日方编成表记录</span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#pingdiquan" data-amplitude-event="story_started" className="story-button personal-button-light">
                从 1936 年开始
                <ArrowRight className="size-4" />
              </a>
              <Link href="/archives#SRC-013" data-amplitude-event="hero_evidence_opened" className="personal-dark-link">
                打开这份原件
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <aside className="sukaiyuan-document-stage" aria-label="朱自清《绥行纪略》同期影印件">
            <div className="sukaiyuan-document-meta">
              <p>1936 · 清华校刊第 792 号</p>
              <span className="sukaiyuan-document-type">
                第三方官方数字影印局部 · SRC-013 · 本地审阅
              </span>
            </div>
            <Link href="/archives#SRC-013" className="sukaiyuan-document-sheet group">
              <Image
                src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
                alt="朱自清《绥行纪略》同期校刊影印局部，文中可见平地泉及留守司令苏开元团长的文字记录"
                width={1835}
                height={1035}
                className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.015]"
                sizes="(min-width: 1024px) 52vw, 100vw"
                priority
              />
              <span className="sukaiyuan-document-marker" aria-hidden="true" />
              <span className="sukaiyuan-document-loupe" aria-hidden="true">
                <Image
                  src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
                  alt=""
                  width={1835}
                  height={1035}
                  className="h-full w-full scale-[2.65] object-cover object-[58%_58%] grayscale"
                  sizes="160px"
                />
              </span>
              <span className="sukaiyuan-document-action">
                查看来源记录与官方影印
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <p className="mt-3 text-[11px] leading-5 tracking-wide text-[#aaa69f]">
              第三方史料局部仅供本地研究审阅，不随本站文章授权；本站红线与放大镜为阅读标注，不属于原始影印件。
            </p>
            <blockquote className="sukaiyuan-hero-quote">
              <Quote className="size-5 shrink-0 text-[#c38a82]" strokeWidth={1.5} aria-hidden="true" />
              <span>“早飯後，至第二師範，適平地泉各界自衛會在此開會，遇留守司令蘇開元團長。”</span>
            </blockquote>
          </aside>
        </div>
        <div className="story-shell suikaiyuan-mission">
          <p>从一份家族记忆出发，建立一个可查证、可连接、也承认未知的人物档案。</p>
          <span className="sukaiyuan-mission-label">Family memory × public history</span>
        </div>
      </section>

      <section id="pingdiquan" className="scroll-mt-28 py-20 sm:py-28 lg:py-36">
        <div className="story-shell grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="story-date text-primary">11.21</p>
            <p className="mt-3 text-sm tracking-[0.18em] text-muted-foreground uppercase">1936 · 平地泉</p>
            <div className="mt-7 h-px w-full bg-foreground/15" />
            <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              平地泉，今集宁一带
            </p>
          </div>

          <div className="max-w-4xl">
            <p className="story-kicker">文献深读 01</p>
            <h2 className="story-heading mt-4 max-w-3xl">朱自清的文字，究竟记录了什么</h2>

            <div className="mt-9 max-w-3xl space-y-6 text-lg leading-9 text-muted-foreground">
              <p>
                朱自清在《绥行纪略》中写到，1936 年 11 月 21 日在平地泉“遇留守司令苏开元团长”。
                这里能够核验的是文章在指定位置出现了这一称谓，不是对人物身份的确认。
              </p>
              <p>
                这份材料能说明：朱自清在指定日期与地点写到一位同名团长。它还不能说明：
                这就是家族记忆中的苏开元，更不能独自支撑他的性格、现场对白或完整履历。
              </p>
            </div>

            <div className="mt-14 grid gap-8 border-y border-foreground/15 py-9 md:grid-cols-2 md:gap-12">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-confirmed">
                  <CircleDot className="size-4" />
                  文本中可以核对
                </div>
                <p className="mt-4 leading-7 text-muted-foreground">
                  文章记载的日期、地点、称谓，以及这段文字在同期校刊中的刊载位置。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-candidate">
                  <Scale className="size-4" />
                  身份上仍不能确认
                </div>
                <p className="mt-4 leading-7 text-muted-foreground">
                  这位同名记录对象就是家族记忆中的苏开元，也不能自动把 1933、1936、1942
                  三份记录合并为同一个人的连续生平。
                </p>
              </div>
            </div>

            <Link
              href="/events"
              data-amplitude-event="historical_context_opened"
              className="story-text-link mt-8"
            >
              查看这条记录的完整来源登记
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="story-dark py-20 text-[#f3efe7] sm:py-28 lg:py-32">
        <div className="story-shell">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <p className="story-kicker text-[#c38a82]">不是一条传记年表</p>
              <h2 className="story-heading mt-4 max-w-3xl text-[#f3efe7]">三个年份，两段尚未被证明的空白</h2>
            </div>
            <p className="text-base leading-7 text-[#bcb8b0]">
              名字相同，不等于人物相同。这里展示的是三次彼此分离的文献出现，
              空白本身也是研究结论的一部分。
            </p>
          </div>

          <div className="mt-16 grid gap-0 lg:grid-cols-3">
            {eventRecords.map((event, index) => (
              <article
                key={event.event_id}
                className={cn(
                  'story-fragment relative border-t border-white/20 py-9 lg:min-h-[25rem] lg:border-t-0 lg:border-l lg:px-9',
                  event.year === 1936 && 'story-fragment-focus',
                  index === eventRecords.length - 1 && 'lg:border-r'
                )}
              >
                <p className="story-fragment-year">{event.year}</p>
                <p className="mt-6 text-xs font-semibold tracking-[0.17em] text-[#c38a82] uppercase">
                  {event.context}
                </p>
                <h3 className="mt-4 story-quote text-2xl leading-snug text-[#f3efe7]">{event.title}</h3>
                <p className="mt-5 text-sm leading-7 text-[#aaa69f]">{event.description}</p>
                <p className="mt-7 border-t border-white/15 pt-5 text-xs leading-6 text-[#aaa69f]">
                  与家族人物的关系：{event.identity_link_statuses.includes('candidate') ? '尚未确认' : '不适用'}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-white/20 pt-7 sm:flex-row sm:items-center">
            <p className="max-w-3xl text-sm leading-7 text-[#aaa69f]">
              1933 与 1942 的记录不是 1936 事件的前后章节。当前找到的材料还不能跨越这些年份。
            </p>
            <Link
              href="/timeline"
              data-amplitude-event="fragment_timeline_opened"
              className="story-text-link shrink-0 text-[#f3efe7] after:bg-[#f3efe7]"
            >
              查看断片时间线
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 lg:py-36">
        <div className="story-shell grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-24">
          <div>
            <p className="story-kicker">一条证据的两种载体</p>
            <h2 className="story-heading mt-4">我们如何知道这句话存在</h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
              影印件帮助核对原貌，转录帮助检索文字。它们指向同一篇《绥行纪略》，
              因此只能算一个独立来源，而不是两份互相印证的证据。
            </p>
            <Link
              href="/methodology"
              data-amplitude-event="methodology_opened"
              className="story-text-link mt-8"
            >
              读懂我们的证据方法
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="border-y border-foreground/15">
            <div className="grid gap-4 border-b border-foreground/15 py-7 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">官方影印</p>
              <div>
                <h3 className="story-quote text-xl leading-8 text-foreground">{officialFacsimile?.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">负责核对版面、原文位置与文献身份。</p>
              </div>
            </div>
            <div className="grid gap-4 border-b border-foreground/15 py-7 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">本地转录</p>
              <div>
                <h3 className="story-quote text-xl leading-8 text-foreground">{localTranscript?.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">负责检索与逐句对照，不增加独立来源数。</p>
              </div>
            </div>
            <div className="grid gap-4 py-7 sm:grid-cols-[7rem_minmax(0,1fr)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">核验结论</p>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <span>A 级同期材料</span>
                <span>2 个载体</span>
                <span>1 个独立来源</span>
                <span>人物身份：仍待连接</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-surface-container-lowest py-20 sm:py-28">
        <div className="story-shell">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
            <div>
              <p className="story-kicker">继续追索</p>
              <h2 className="story-heading mt-4">一个名字，仍在等待更多材料</h2>
              <p className="mt-7 text-base leading-8 text-muted-foreground">
                这个网站不替空白编故事。它把已经找到的证据摆出来，也把下一步需要寻找的材料说清楚。
              </p>
            </div>

            <div className="divide-y divide-foreground/15 border-y border-foreground/15">
              {archiveEntries.map((entry, index) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  data-amplitude-event={entry.event}
                  className="group grid gap-5 py-7 transition-colors hover:text-primary sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="text-sm tabular-nums text-muted-foreground">0{index + 1}</span>
                  <span>
                    <span className="block text-xs font-semibold tracking-[0.16em] text-primary uppercase">{entry.eyebrow}</span>
                    <span className="story-quote mt-2 block text-2xl leading-snug text-foreground group-hover:text-primary">
                      {entry.title}
                    </span>
                    <span className="mt-2 block max-w-2xl text-sm leading-6 text-muted-foreground">{entry.description}</span>
                  </span>
                  <ArrowRight className="hidden size-5 text-primary transition-transform group-hover:translate-x-1 sm:block" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="story-shell">
          <div className="grid overflow-hidden border border-foreground/15 bg-card lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <div className="flex size-11 items-center justify-center rounded-full border border-primary/25 text-primary">
                <FileSearch className="size-5" />
              </div>
              <h2 className="story-heading mt-7 max-w-2xl">这是一项由家族记忆发起、由证据约束的寻找</h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
                发起人自述与苏开元有曾祖孙关系；这份家族关系尚未在当前已公开的材料中完成核验。
                AI 可以协助整理和发现线索，但不作历史证据。
              </p>
              <Link
                href="/about"
                data-amplitude-event="research_participation_opened"
                className="story-text-link mt-8"
              >
                了解项目与参与方式
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="story-boundary flex flex-col justify-between p-7 text-[#f3efe7] sm:p-10 lg:p-14">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#c38a82] uppercase">
                  <UsersRound className="size-4" />
                  本地审阅边界
                </div>
                <p className="story-quote mt-7 text-2xl leading-relaxed">
                  公开承认未知，
                  <br />比用传奇填满空白更接近一个真实的人。
                </p>
              </div>
              <div className="mt-12 border-t border-white/20 pt-6 text-xs leading-6 text-[#aaa69f]">
                <p>资料版本：{dataMeta.research_snapshot_id}</p>
                <p className="mt-1">部分依赖混合来源的内容仍暂缓 · 仅供本地审阅</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
