import { Logo } from './logo'

const links = [
    {
        title: 'Convex',
        href: 'https://convex.link/cpanel',
    },
    {
        title: 'Github',
        href: 'https://github.com/robertalv/convex-panel',
    },
    {
        title: 'NPM',
        href: 'https://www.npmjs.com/package/convex-panel',
    },
    {
        title: 'Docs',
        href: '/docs',
    },
    {
        title: 'Changelog',
        href: '/changelog',
    },
]

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-24 relative">
            {/* Section divider */}
            <div className="section-divider mb-16 md:mb-20" />

            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <a href="https://convex.link/cpanel" aria-label="go home" className="mx-auto inline-block hover:opacity-80 transition-opacity">
                        <Logo width={48} height={48} />
                    </a>
                    <p className="text-muted-foreground text-sm mt-4 max-w-md mx-auto">
                        The developer-focused panel for Convex, built with love.
                    </p>
                </div>

                <div className="my-10 flex flex-wrap justify-center gap-8 text-sm">
                    {links.map((link, index) => (
                        <a
                            key={index}
                            href={link.href}
                            className="footer-link text-muted-foreground hover:text-[#34D399] transition-colors duration-200"
                        >
                            <span>{link.title}</span>
                        </a>
                    ))}
                </div>

                {/* Product Hunt badge */}
                <div className="my-6 flex justify-center">
                    <a
                        href="https://www.producthunt.com/products/convex-panel?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-convex-panel-2"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Convex Panel on Product Hunt"
                        className="inline-block hover:opacity-90 transition-opacity"
                    >
                        <img
                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1044632&theme=light&t=1764597876986"
                            alt="Convex Panel - A real-time control panel for your Convex backend | Product Hunt"
                            width={250}
                            height={54}
                            className="h-[54px] w-[250px] max-w-full"
                        />
                    </a>
                </div>

                <div className="my-10 flex flex-wrap justify-center gap-5">
                    <a
                        href="https://devwithbobby.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Dev With Bobby"
                        className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110"
                    >
                        <img src="/devwithbobby.png" alt="devwithbobby.com" width={28} height={28} className="rounded-full ring-2 ring-transparent hover:ring-[#34D399]/30 transition-all" />
                    </a>
                    <a href="https://x.com/convex_dev" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter" className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"></path>
                        </svg>
                    </a>
                    <a href="https://www.linkedin.com/company/convex-dev/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"></path>
                        </svg>
                    </a>
                    <a href="https://www.facebook.com/convex.dev" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"></path>
                        </svg>
                    </a>
                    <a href="https://www.threads.net/@convex_dev" target="_blank" rel="noopener noreferrer" aria-label="Threads" className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.25 8.505c-1.577-5.867-7-5.5-7-5.5s-7.5-.5-7.5 8.995s7.5 8.996 7.5 8.996s4.458.296 6.5-3.918c.667-1.858.5-5.573-6-5.573c0 0-3 0-3 2.5c0 .976 1 2 2.5 2s3.171-1.027 3.5-3c1-6-4.5-6.5-6-4" color="currentColor"></path>
                        </svg>
                    </a>
                    <a href="https://www.instagram.com/convex_dev" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-[#34D399] transition-all duration-200 hover:scale-110">
                        <svg className="size-6" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"></path>
                        </svg>
                    </a>
                </div>

                <div className="text-center pt-8 border-t border-border/50">
                    <p className="text-muted-foreground text-xs">
                        © {new Date().getFullYear()} Convex Panel. Built with ❤️ for the Convex community.
                    </p>
                </div>
            </div>
        </footer>
    )
}
