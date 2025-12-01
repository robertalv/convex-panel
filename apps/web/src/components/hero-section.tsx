import { ArrowRight, Sparkles } from 'lucide-react'
import { TextEffect } from './motion-primitives/text-effect'
import { AnimatedGroup, type AnimatedGroupProps } from './motion-primitives/animated-group'
import { HeroHeader } from './hero5-header'
import { CopyButton } from './copy-button'

const transitionVariants: NonNullable<AnimatedGroupProps['variants']> = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        {/* Enhanced gradient background effects */}
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block">
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
          {/* Accent color glow */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#34D399]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#F3B01C]/5 rounded-full blur-3xl" />
        </div>
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: 'spring',
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20">
              <img
                src="/panel-data.png"
                alt="background"
                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                width="3276"
                height="4095"
              />
            </AnimatedGroup>
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  },
                }}>
                  <a
                    href="https://www.youtube.com/watch?v=RizdXfl-ZXo"
                    target="_blank"
                    className="hover:bg-background dark:hover:border-t-[#34D399]/30 bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border border-[#34D399]/20 p-1 pl-4 shadow-md shadow-[#34D399]/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950 hover:shadow-[#34D399]/10">
                    <Sparkles className="size-4 text-[#34D399]" />
                    <span className="text-foreground text-sm">Convex Panel Installation & Demo</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-[#34D399] group-hover:bg-[#26a878] size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-black" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3 text-black" />
                        </span>
                      </div>
                    </div>
                  </a>
                </AnimatedGroup>


                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl font-medium tracking-tight">
                  Debug Smarter, Ship Faster with
                </TextEffect>
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h2"
                  className="text-balance font-bold text-5xl md:text-6xl xl:text-7xl text-gradient-accent">
                  Convex Panel
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
                  Real-time data view, live logs, advanced filtering, health monitoring, and in-place data editing — all in a beautiful, developer-focused UI.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                  <div
                    key={1}
                    className="bg-foreground/5 rounded-[calc(var(--radius-xl)+0.125rem)] border border-[#34D399]/20 p-0.5 flex items-center glow-accent">
                    <CopyButton />
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div
                  aria-hidden
                  className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="relative mx-auto max-w-7xl max-h-[550px] overflow-hidden rounded-2xl border border-[#34D399]/20 shadow-2xl shadow-[#34D399]/10">
                  <img
                    className="bg-background aspect-15/8 relative hidden dark:block"
                    src="/panel-data.png"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                  <img
                    className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                    src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fconvex-panel1.png?alt=media&token=d4b6da5e-db91-4b94-9d7a-a716ebebdedf"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  )
}
