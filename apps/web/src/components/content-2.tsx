import { Cpu, Zap, Activity, Database } from 'lucide-react'

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32 relative">
            {/* Section divider */}
            <div className="section-divider mb-16 md:mb-32" />

            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="text-center">
                    <span className="text-[#34D399] text-sm font-medium uppercase tracking-wider">Features</span>
                    <h2 className="relative z-10 w-full text-3xl font-medium lg:text-4xl mt-3">
                        Transform Your Experience with <span className="text-gradient-accent">Convex Panel</span>
                    </h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                        A groundbreaking tool that redefines how developers engage with Convex data
                    </p>
                </div>
                <div className="relative">
                    <div className="relative z-10 space-y-6 md:w-1/2">
                        <div className="space-y-4">
                            <p className="text-foreground/80 leading-relaxed">
                                Unleash the potential of <span className="text-[#34D399] font-medium">Convex Panel</span>, a groundbreaking tool that redefines how developers engage with <a href="https://convex.link/cpanel" className="underline text-[#34D399] font-medium hover:text-[#26a878] transition-colors">Convex</a> data.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">Convex Panel ensures a smooth integration journey, offering APIs and platforms that drive innovation and streamline development processes.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <div className="feature-card p-4 space-y-3">
                                <div className="icon-container">
                                    <Database className="size-4 text-[#34D399]" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Real-time Data View</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">Browse and filter your Convex tables with ease, ensuring seamless data interactions.</p>
                            </div>
                            <div className="feature-card p-4 space-y-3">
                                <div className="icon-container">
                                    <Cpu className="size-4 text-[#34D399]" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Live Logs</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">Monitor function calls, HTTP actions, and system events in real-time.</p>
                            </div>
                            <div className="feature-card p-4 space-y-3">
                                <div className="icon-container">
                                    <Zap className="size-4 text-[#34D399]" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Advanced Filtering</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">Filter logs and data with powerful query capabilities to streamline your workflow.</p>
                            </div>
                            <div className="feature-card p-4 space-y-3">
                                <div className="icon-container">
                                    <Activity className="size-4 text-[#34D399]" />
                                </div>
                                <h3 className="text-sm font-semibold text-foreground">Health Monitoring</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">Track application health with metrics for cache rates, scheduler health, and system latency.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 h-fit md:absolute md:-inset-y-12 md:inset-x-0 md:mt-0">
                        <div aria-hidden className="bg-linear-to-l z-1 to-background absolute inset-0 hidden from-transparent to-55% md:block"></div>
                        <div className="border-border/0 relative rounded-2xl border border-dotted">
                            <img src="/logs.png" className="hidden rounded-xl border border-[#34D399]/20 shadow-2xl shadow-[#34D399]/10 dark:block" alt="payments illustration dark" width={1207} height={929} />
                            <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel-3.png?alt=media&token=8b4a870b-11f3-4532-a2a4-bf146c25488a" className="rounded-xl shadow-xl dark:hidden -mt-12" alt="payments illustration light" width={1207} height={929} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
