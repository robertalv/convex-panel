import { Button } from './ui/button'
import { AnimatedGroup, type AnimatedGroupProps } from './motion-primitives/animated-group'
import { ConvexCopyButton } from './convex-copy-button'

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
        <section className="py-16">
            <div className="inset-0 mx-auto max-w-5xl rounded-3xl border px-6 py-4 md:py-10 lg:py-16 relative">
                <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl" aria-hidden="true">
                    {/* Convex Background */}
                    <div style={{
                        backgroundImage: 'linear-gradient(to right, rgb(215, 215, 215) 1px, transparent 1px), linear-gradient(rgb(215, 215, 215) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        borderBottom: '1px solid rgb(215, 215, 215)',
                        borderTopColor: 'rgb(215, 215, 215)',
                        borderRight: '1px solid rgb(215, 215, 215)',
                        borderLeftColor: 'rgb(215, 215, 215)',
                        borderTopStyle: 'solid',
                        borderLeftStyle: 'solid',
                        height: '100%',
                        width: '100%',
                        opacity: 0.1,
                        animation: 'fadeIn 2s forwards',
                        maskImage: 'radial-gradient(circle at center, transparent, black)',
                        WebkitMaskImage: 'radial-gradient(circle at center, transparent, black)'
                    }}>
                        <style>{`
                            @keyframes fadeIn {
                                0% {
                                    opacity: 0;
                                }
                                100% {
                                    opacity: 0.1;
                                }
                            }
                        `}</style>
                    </div>
                </div>
                <div className="overflow-visible absolute -top-6 right-14 hidden h-16 w-11 sm:block lg:-top-10">
                    <img
                        src="/start-now-top.svg"
                        alt=""
                        width={44}
                        height={88}
                        className="object-contain"
                        aria-hidden="true"
                    />
                </div>
                <div className="absolute -left-8 bottom-16 hidden h-20 w-12 sm:block lg:-left-4 lg:h-32 lg:w-20">
                    <img
                        src="/start-now-left.svg"
                        alt=""
                        width={36}
                        height={120}
                        className="object-contain"
                        aria-hidden="true"
                    />
                </div>
                <div className="absolute -bottom-10 -right-4 hidden h-14 w-9 sm:block lg:-bottom-14 lg:right-48 lg:h-24 lg:w-16">
                    <img
                        src="/start-now-bottom.svg"
                        alt=""
                        width={48}
                        height={96}
                        className="object-contain"
                        aria-hidden="true"
                    />
                </div>
                <div className="text-center relative z-10">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Start Building with Convex</h2>
                    <p className="mt-4">Convex is the open-source reactive database for app developers.</p>

                    <div className="flex flex-wrap justify-center gap-4">
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
                                className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5 flex items-center">
                            <Button asChild size="lg" className="rounded-xl px-5 text-base font-mono flex items-center cursor-pointer">
                                <a href="https://convex.link/cpanel" target="_blank" rel="noreferrer">
                                    <span>Get Started</span>
                                </a>
                            </Button>
                            </div>
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
                            className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                            <div
                                key={1}
                                className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5 flex items-center">
                                <ConvexCopyButton />
                            </div>
                            </AnimatedGroup>
                    </div>
                </div>
            </div>
        </section>
    )
}
