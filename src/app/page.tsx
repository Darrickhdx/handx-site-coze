import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Cpu,
  FileText,
  Mail,
  Network,
  PenTool,
} from 'lucide-react';
import { featuredStories } from '@/content/editorial';
import { profile, profileHighlights } from '@/content/profile';
import { firstVisitPaths, homeSections, knowledgeNodes } from '@/content/site';

export default function HomePage() {
  return (
    <div className="personal-home overflow-hidden">
      <section className="personal-hero border-b border-foreground/15">
        <div className="personal-shell grid min-h-[calc(100svh-7.5rem)] items-center gap-14 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(29rem,0.95fr)] lg:gap-12 lg:py-20">
          <div className="relative z-10 max-w-[43rem]">
            <p className="personal-kicker">
              <span aria-hidden="true" />
              AI × Hardware × Product × Story
            </p>

            <Link href="/about" className="personal-identity-lockup mt-7">
              <Image
                src={profile.portrait}
                alt={`${profile.displayName}的黑白头像`}
                width={839}
                height={1024}
                className="personal-identity-avatar"
                sizes="72px"
                priority
              />
              <span>
                <strong>{profile.displayName}</strong>
                <small>{profile.title}</small>
              </span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <h1 className="personal-display mt-7 text-[clamp(3.25rem,4.8vw,5.4rem)] font-semibold leading-[1.04] tracking-[-0.055em]">
              让 AI 进入真实世界，
              <span className="mt-2 block text-accent">也照亮一段家族记忆。</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-9 text-muted-foreground sm:text-xl">
              {profile.shortBio}
            </p>
            <p className="mt-3 max-w-2xl text-xs leading-6 text-muted-foreground">
              职业履历由本人提供；项目公开资料只核验产品与时代背景，不替代个人任职证明。
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/about"
                className="story-button personal-button-primary"
                data-amplitude-event="home_profile_opened"
              >
                认识我与 AI 实践
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sukaiyuan"
                className="story-text-link"
                data-amplitude-event="home_sukaiyuan_opened"
              >
                进入苏开元计划
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="personal-map-wrap" aria-label="从苏开元计划通往历史事件、人物、原件与研究方法的知识路径">
            <div className="personal-map-heading">
              <p>当前旗舰实践 · 寻找苏开元</p>
              <span>连线只表示阅读路径，不代表人物关系、身份或因果结论</span>
            </div>

            <div className="personal-map" role="group" aria-label="苏开元计划阅读导航">
              <span className="map-line map-line-one" aria-hidden="true" />
              <span className="map-line map-line-two" aria-hidden="true" />
              <span className="map-line map-line-three" aria-hidden="true" />
              <span className="map-line map-line-four" aria-hidden="true" />
              <span className="map-line map-line-five" aria-hidden="true" />

              {knowledgeNodes.map((node) => (
                <Link
                  key={node.id}
                  href={node.href}
                  className={`map-node map-node-${node.id} map-node-${node.tone}`}
                  data-amplitude-event="knowledge_node_opened"
                  data-amplitude-node={node.id}
                >
                  <strong>{node.label}</strong>
                  <span>{node.note}</span>
                </Link>
              ))}

              <Link
                href="/archives#SRC-013"
                className="map-document group"
                data-amplitude-event="hero_document_opened"
              >
                <Image
                  src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
                  alt="1936 年朱自清《绥行纪略》同期校刊影印局部，包含苏开元团长的文字记录"
                  width={1835}
                  height={1035}
                  className="h-full w-full object-cover grayscale"
                  sizes="(min-width: 1024px) 420px, 100vw"
                  priority
                />
                <span>
                  第三方史料 · 本地审阅
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>

            <div className="personal-map-foot">
              <p>{knowledgeNodes.length} 个探索入口 · 阅读路径回到材料 · 空白仍然保留</p>
              <Link href="/graph">
                查看当前研究图谱
                <Network className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="start-here" className="scroll-mt-28 border-b border-foreground/15 py-20 sm:py-28">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-20">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Start here
              </p>
              <h2 className="personal-heading mt-6">第一次来，沿着这条路走。</h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
                先进入一个真实问题，再看 AI 怎样参与整理与表达，最后认识背后的人。每个入口都回到可核对的材料和真实实践。
              </p>
            </div>

            <div className="border-y border-foreground/15">
              {firstVisitPaths.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.number}
                    href={item.href}
                    className="personal-path group"
                    data-amplitude-event="first_visit_step_opened"
                    data-amplitude-step={item.number}
                  >
                    <span className="personal-path-number">{item.number}</span>
                    <Icon className="size-5 text-primary" strokeWidth={1.6} aria-hidden="true" />
                    <span className="personal-path-copy">
                      <strong>{item.title}</strong>
                      <span className="personal-path-description">{item.description}</span>
                    </span>
                    <span className="personal-path-link">
                      {item.label}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-20 sm:py-28">
        <div className="personal-shell">
          <div className="flex flex-col justify-between gap-7 border-b border-foreground/15 pb-9 lg:flex-row lg:items-end">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Latest stories
              </p>
              <h2 className="personal-heading mt-6">现在，可以真正读点什么。</h2>
            </div>
            <div className="max-w-xl">
              <p className="text-base leading-8 text-muted-foreground">
                三篇完整专题已经把研究后台翻译成读者路径：一个历史现场、一个身份谜题、一套 AI 方法。
              </p>
              <Link href="/discover" className="story-text-link mt-5">
                查看全部专题
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden border-x border-b border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {featuredStories.map((story) => (
              <Link
                key={story.slug}
                href={story.href}
                className="group flex min-h-[25rem] flex-col bg-background p-7 transition-colors hover:bg-card sm:p-9"
                data-amplitude-event="home_featured_story_opened"
                data-amplitude-story={story.slug}
              >
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold tracking-[0.16em] text-primary uppercase">{story.layer}</span>
                  <span className="font-serif text-3xl italic text-primary/30">{story.number}</span>
                </div>
                <h3 className="mt-12 font-serif text-3xl font-semibold leading-snug tracking-[-0.03em]">{story.title}</h3>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{story.dek}</p>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-foreground/15 pt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {story.readTime}
                  </span>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="scroll-mt-28 py-20 sm:py-28 lg:py-32">
        <div className="personal-shell">
          <div className="flex flex-col justify-between gap-7 border-b border-foreground/15 pb-9 lg:flex-row lg:items-end">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Four paths
              </p>
              <h2 className="personal-heading mt-6">四条线索，一份共同的个人档案。</h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              档案、专题、AI 方法与小说已经各有可读内容；家族史工作室则把这套流程继续做成可复用的服务。
            </p>
          </div>

          <div className="personal-sections-grid">
            {homeSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <article key={section.id} id={section.id} className={`personal-section personal-section-${section.accent}`}>
                  <div className="flex items-start justify-between gap-5">
                    <span className="personal-section-index">0{index + 1}</span>
                    <Icon className="size-6" strokeWidth={1.35} aria-hidden="true" />
                  </div>
                  <p className="mt-12 text-[11px] font-bold tracking-[0.18em] uppercase">{section.eyebrow}</p>
                  <h3 className="mt-4 font-serif text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl">
                    {section.title}
                  </h3>
                  <p className="mt-5 text-base leading-8 text-muted-foreground">{section.description}</p>
                  <div className="mt-9 border-t border-foreground/15 pt-5">
                    <p className="text-xs text-muted-foreground">{section.status}</p>
                    <Link href={section.href} className="story-text-link mt-4" data-amplitude-event="home_section_opened">
                      {section.linkLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="personal-feature border-y border-white/15 py-20 text-[#f3efe7] sm:py-28">
        <div className="personal-shell grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)] lg:items-center lg:gap-20">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Flagship project 01
            </p>
            <h2 className="personal-feature-title mt-7">寻找苏开元</h2>
            <p className="mt-4 font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
              一个普通人，如何穿过一个大时代。
            </p>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#bdb9b0]">
              一边是家族记忆中的曾祖父，一边是 1936 年朱自清笔下的“留守司令苏开元团长”。
              这项研究不急着把二者说成同一个人，而是公开寻找能够连接它们的证据。
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/sukaiyuan" className="story-button personal-button-light">
                进入苏开元计划
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/archives" className="personal-dark-link">
                打开原件阅览室
                <FileText className="size-4" />
              </Link>
            </div>
          </div>

          <Link href="/sukaiyuan" className="personal-feature-document group" aria-label="进入寻找苏开元专题">
            <Image
              src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
              alt="1936 年朱自清《绥行纪略》同期校刊影印局部，包含苏开元团长的文字记录"
              width={1835}
              height={1035}
              className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.015]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <span className="personal-feature-stamp">朱自清<br />绥行纪略</span>
            <span className="personal-feature-caption">
              1936 · 第三方校刊影印局部 · 本地审阅 · 不随文授权
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-20 sm:py-28">
        <div className="personal-shell grid gap-14 lg:grid-cols-[minmax(28rem,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-20">
          <Link href="/novel" className="fiction-home-image group">
            <Image
              src="/assets/editorial/fiction-north-city-collage-v1.png"
              alt="虚构北城雪夜、旧纸、空椅与缺页账簿组成的抽象小说概念拼贴"
              width={1586}
              height={992}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.012]"
              sizes="(min-width: 1024px) 54vw, 100vw"
            />
            <span>AI 艺术想象 · 不是历史照片</span>
          </Link>

          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Novel room
            </p>
            <PenTool className="mt-8 size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">史料到不了的地方，小说可以去。</h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground">
              前提是读者始终知道：哪一段来自原件，哪一步是合理外推，哪一场从头到尾都是虚构。
              三篇审计样章已经可以试读。
            </p>
            <blockquote className="mt-8 border-l-2 border-primary pl-6 font-serif text-2xl leading-relaxed text-foreground">
              “纸不会撒谎，但纸也不告诉人是谁换了它。”
            </blockquote>
            <Link href="/novel" className="story-button story-button-primary mt-9">
              进入小说试读
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="about-me" className="scroll-mt-28 py-20 sm:py-28">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              About the builder
            </p>
            <figure className="personal-about-portrait mt-8">
              <Image
                src={profile.portrait}
                alt={`${profile.displayName}的黑白头像`}
                width={839}
                height={1024}
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="h-full w-full object-cover"
              />
              <figcaption>
                <strong className="personal-about-name">{profile.displayName}</strong>
                <span className="personal-about-role">{profile.title}</span>
              </figcaption>
            </figure>
          </div>
          <div className="max-w-3xl">
            <Cpu className="size-7 text-primary" strokeWidth={1.45} aria-hidden="true" />
            <h2 className="personal-heading mt-7">把二十年的产品经验，重新投入 AI。</h2>
            <div className="mt-8 space-y-6 text-lg leading-9 text-muted-foreground">
              <p>{profile.homeBio}</p>
              <p>{profile.statement}</p>
              <p>
                “苏开元计划”是这套方法的第一个长期样本：它同时长成史料库、知识图谱、专题文章、
                历史小说和网站，也让我重新思考一个人如何借助 AI 完成过去需要团队才能完成的连接与表达。
              </p>
            </div>

            <div className="personal-proof-grid mt-10">
              {profileHighlights.map((item) => (
                <div key={item.value} className="profile-stat">
                  <strong className="profile-stat-value">{item.value}</strong>
                  <span className="profile-stat-label">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-foreground/15 pt-7 sm:flex-row sm:items-center">
              <Link href="/about" className="story-button story-button-primary">
                查看完整经历
                <ArrowRight className="size-4" />
              </Link>
              <a href={`mailto:${profile.email}`} className="story-text-link">
                <Mail className="size-4" />
                联系我
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
