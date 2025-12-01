import { Logo } from './logo'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import React from 'react'
import { cn } from '../lib/utils'

const menuItems = [
    { name: 'Convex', href: 'https://convex.link/cpanel' },
    { name: 'Docs', href: '/docs' },
    { name: 'Changelog', href: '/changelog' },
]

export const HeroHeader = () => {
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 16)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className="fixed inset-x-0 top-0 z-30">
            <nav
                className={cn(
                    'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 transition-all duration-300',
                    isScrolled ? 'mt-2' : 'mt-4'
                )}
            >
                <div
                    className={cn(
                        'flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-background/40 px-4 py-3 backdrop-blur-sm transition-all duration-300',
                        'shadow-sm shadow-black/5',
                        isScrolled &&
                            'border-border/60 bg-background/80 shadow-lg shadow-[#34D399]/5'
                    )}
                >
                    {/* Logo */}
                    <a
                        href="/"
                        aria-label="Home"
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Logo />
                    </a>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center gap-8 text-sm">
                        <ul className="flex items-center gap-6">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <a
                                        href={item.href}
                                        className="text-muted-foreground hover:text-[#34D399] transition-colors duration-200"
                                    >
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Discord button - rounded pill, more prominent */}
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-full border-[#5865F2]/60 bg-background/60 hover:border-[#5865F2] hover:bg-[#5865F2]/15 px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
                        >
                            <a
                                href="https://discord.com/invite/nk6C2qTeCq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5"
                            >
                                <svg
                                    className="size-4"
                                    viewBox="0 -28.5 256 256"
                                    xmlns="http://www.w3.org/2000/svg"
                                    preserveAspectRatio="xMidYMid"
                                >
                                    <g>
                                        <path
                                            d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                                            fill="#5865F2"
                                            fillRule="nonzero"
                                        />
                                    </g>
                                </svg>
                                <span>Join us on Discord</span>
                            </a>
                        </Button>

                        {/* GitHub stars button - custom pill instead of raw iframe */}
                        <a
                            href="https://github.com/robertalv/convex-panel"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:border-[#34D399]/70 hover:text-foreground hover:bg-background transition-all duration-200"
                        >
                            <svg
                                viewBox="0 0 16 16"
                                aria-hidden="true"
                                className="size-4 text-muted-foreground"
                            >
                                <path
                                    fill="currentColor"
                                    d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
                                     0-.19-.01-.82-.01-1.49-2 0-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
                                     -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
                                     -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
                                     0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04
                                     2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
                                     0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
                                     0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
                                />
                            </svg>
                            <span>Star on GitHub</span>
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
                        className="inline-flex items-center justify-center rounded-full bg-background/70 p-2 text-muted-foreground ring-1 ring-border/60 hover:text-foreground hover:ring-[#34D399]/60 transition-all duration-200 md:hidden"
                    >
                        {menuOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>

                {/* Mobile menu */}
                <div
                    className={cn(
                        'md:hidden transition-[max-height,opacity] duration-200 ease-out overflow-hidden',
                        menuOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="rounded-2xl border border-border/60 bg-background/95 px-4 py-4 shadow-lg shadow-[#34D399]/10 backdrop-blur-xl">
                        <ul className="space-y-3 text-sm">
                            {menuItems.map((item) => (
                                <li key={item.href}>
                                    <a
                                        href={item.href}
                                        className="block rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted/40 hover:text-[#34D399] transition-colors duration-200"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-col gap-3">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full justify-center border-[#5865F2]/40 bg-background/40 hover:border-[#5865F2] hover:bg-[#5865F2]/10 transition-all duration-200"
                            >
                                <a
                                    href="https://discord.com/invite/nk6C2qTeCq"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                >
                                    <svg
                                        className="size-4"
                                        viewBox="0 -28.5 256 256"
                                        xmlns="http://www.w3.org/2000/svg"
                                        preserveAspectRatio="xMidYMid"
                                    >
                                        <g>
                                            <path
                                                d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                                                fill="#5865F2"
                                                fillRule="nonzero"
                                            />
                                        </g>
                                    </svg>
                                    <span>Join us on Discord</span>
                                </a>
                            </Button>
                            <div className="flex justify-center">
                                <iframe
                                    src="https://ghbtns.com/github-btn.html?user=robertalv&repo=convex-panel&type=star&count=true&size=large"
                                    width="140"
                                    height="30"
                                    title="GitHub Stars"
                                    className="rounded border border-border/40 bg-background/80"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
