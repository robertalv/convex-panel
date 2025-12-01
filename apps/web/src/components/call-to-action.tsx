import { Button } from './ui/button'
import { AnimatedGroup, type AnimatedGroupProps } from './motion-primitives/animated-group'
import { ConvexCopyButton } from './convex-copy-button'
import { ArrowRight, Rocket } from 'lucide-react'

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

export default function CallToAction() {
    return (
        <section className="py-16 md:py-24">
            {/* Section divider */}
            <div className="section-divider mb-16 md:mb-20" />

            <div className="inset-0 mx-auto max-w-5xl rounded-3xl border border-[#34D399]/20 px-6 py-8 md:py-12 lg:py-20 relative overflow glow-accent">
                {/* Gradient glow effects */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#34D399]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#F3B01C]/10 rounded-full blur-3xl" />

                <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl" aria-hidden="true">
                    {/* Grid Background */}
                    <div style={{
                        backgroundImage: 'linear-gradient(to right, rgba(52, 211, 153, 0.1) 1px, transparent 1px), linear-gradient(rgba(52, 211, 153, 0.1) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        height: '100%',
                        width: '100%',
                        opacity: 0.3,
                        maskImage: 'radial-gradient(circle at center, black, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 70%)'
                    }} />
                </div>
                <div className="overflow-visible absolute -top-6 right-14 hidden h-16 w-11 sm:block lg:-top-10">
                    <img
                        src="/start-now-top.svg"
                        alt=""
                        width={44}
                        height={88}
                        className="object-contain opacity-70"
                        style={{ filter: 'drop-shadow(0 0 16px #34D399) saturate(1.5) brightness(1.1)' }}
                        aria-hidden="true"
                    />
                </div>
                <div className="absolute -left-8 bottom-16 hidden h-20 w-12 sm:block lg:-left-4 lg:h-32 lg:w-20">
                    <img
                        src="/start-now-left.svg"
                        alt=""
                        width={36}
                        height={120}
                        className="object-contain opacity-70"
                        style={{ filter: 'drop-shadow(0 0 16px #34D399) saturate(1.5) brightness(1.1)' }}
                        aria-hidden="true"
                    />
                </div>
                <div className="absolute -bottom-10 -right-4 hidden h-14 w-9 sm:block lg:-bottom-14 lg:right-48 lg:h-24 lg:w-16">
                    <img
                        src="/start-now-bottom.svg"
                        alt=""
                        width={48}
                        height={96}
                        className="object-contain opacity-70"
                        style={{ filter: 'drop-shadow(0 0 16px #34D399) saturate(1.5) brightness(1.1)' }}
                        aria-hidden="true"
                    />
                </div>
                <div className="text-center relative z-10">
                    <div className="icon-container mx-auto mb-6">
                        <Rocket className="size-5 text-[#34D399]" />
                    </div>
                    <h2 className="text-balance text-3xl font-semibold lg:text-4xl">
                        Start Building with <span className="text-gradient-accent">Convex</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground max-w-md mx-auto">
                        The open-source reactive database for app developers. Get started in minutes.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mt-10">
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
                            className="flex flex-col items-center justify-center gap-2 md:flex-row">
                            <Button asChild size="lg" className="rounded-xl px-6 text-base font-medium flex items-center cursor-pointer bg-[#34D399] hover:bg-[#26a878] text-black gap-2 shadow-lg shadow-[#34D399]/25 transition-all hover:shadow-[#34D399]/40">
                                <a href="https://convex.link/cpanel" target="_blank" rel="noreferrer">
                                    <span>Get Started</span>
                                    <ArrowRight className="size-4" />
                                </a>
                            </Button>
                        </AnimatedGroup>

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
                            className="flex flex-col items-center justify-center gap-2 md:flex-row">
                            <div className="bg-foreground/5 rounded-xl border border-[#34D399]/20 p-0.5 flex items-center">
                                <ConvexCopyButton />
                            </div>
                        </AnimatedGroup>
                    </div>
                </div>
            </div>
        </section>
    )
}
