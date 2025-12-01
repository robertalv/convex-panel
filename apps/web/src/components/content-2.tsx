import { Cpu, Zap } from 'lucide-react'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 w-full text-4xl font-medium lg:text-5xl text-center">Transform Your Experience with Convex Panel</h2>
                <div className="relative">
                    <div className="relative z-10 space-y-4 md:w-1/2">
                        <p className="text-body">
                            Unleash the potential of <span className="text-title font-medium">Convex Panel</span>, a groundbreaking tool that redefines how developers engage with <a href="https://convex.link/cpanel" className="underline text-title font-medium">Convex</a> data.
                        </p>
                        <p>Convex Panel ensures a smooth integration journey, offering APIs and platforms that drive innovation and streamline development processes.</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Real-time Data View</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Browse and filter your Convex tables with ease, ensuring seamless data interactions.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Live Logs</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Monitor function calls, HTTP actions, and system events in real-time for comprehensive insights.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Advanced Filtering</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Filter logs and data with powerful query capabilities to streamline your workflow.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Health Monitoring</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Track application health with metrics for cache rates, scheduler health, and system latency.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
                        <div aria-hidden className="bg-linear-to-l z-1 to-background absolute inset-0 hidden from-transparent to-55% md:block"></div>
                        <div className="border-border/0 relative rounded-2xl border border-dotted">
                            <img src="/logs.png" className="hidden border-2 dark:block" alt="payments illustration dark" width={1207} height={929} />
                            <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel-3.png?alt=media&token=8b4a870b-11f3-4532-a2a4-bf146c25488a" className="rounded-[12px] shadow dark:hidden -mt-12" alt="payments illustration light" width={1207} height={929} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
