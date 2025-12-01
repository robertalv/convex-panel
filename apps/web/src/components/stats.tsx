"use client"

import { useEffect, useState } from 'react';
import { Star, Download, TrendingUp } from 'lucide-react';

const fetchNpmPackageDownloadCount = async (name: string, created: number) => {
  const currentDateIso = new Date().toISOString().substring(0, 10);
  let nextDate = new Date(created);
  let totalDownloadCount = 0;
  let hasMore = true;
  while (hasMore) {
    const from = nextDate.toISOString().substring(0, 10);
    nextDate.setDate(nextDate.getDate() + 17 * 30);
    if (nextDate.toISOString().substring(0, 10) > currentDateIso) {
      nextDate = new Date();
    }
    const to = nextDate.toISOString().substring(0, 10);
    const response = await fetch(
      `https://api.npmjs.org/downloads/range/${from}:${to}/${name}`
    );
    const pageData: {
      end: string;
      downloads: { day: string; downloads: number }[];
    } = await response.json();
    const downloadCount = pageData.downloads.reduce(
      (acc: number, cur: { downloads: number }) => acc + cur.downloads,
      0
    );
    totalDownloadCount += downloadCount;
    nextDate.setDate(nextDate.getDate() + 1);
    hasMore = pageData.end < currentDateIso;
  }
  return totalDownloadCount;
};

export default function StatsSection() {
    const [npmStats, setNpmStats] = useState({ downloads: 0, start: '', end: '' });
    const [githubStars, setGithubStars] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [totalDownloads, setTotalDownloads] = useState(0);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                const lastWeekStr = lastWeek.toISOString().split('T')[0];

                const [npmWeeklyResponse, githubResponse] = await Promise.all([
                    fetch(`https://api.npmjs.org/downloads/point/${lastWeekStr}:${today}/convex-panel`),
                    fetch("https://api.github.com/repos/robertalv/convex-panel")
                ]);

                const npmWeeklyData = await npmWeeklyResponse.json();
                const githubData = await githubResponse.json();

                setNpmStats({
                    downloads: npmWeeklyData.downloads || 0,
                    start: new Date(npmWeeklyData.start).toISOString().split('T')[0],
                    end: new Date(npmWeeklyData.end).toISOString().split('T')[0]
                });
                setGithubStars(githubData.stargazers_count || 0);

                const packageCreationDate = new Date(2023, 0, 1).getTime();
                const total = await fetchNpmPackageDownloadCount('convex-panel', packageCreationDate);
                setTotalDownloads(total);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [today]);

    return (
        <section className="py-16 md:py-24 relative">
            {/* Section divider */}
            <div className="section-divider mb-16 md:mb-20" />

            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 mx-auto max-w-xl space-y-4 text-center">
                    <span className="text-[#34D399] text-sm font-medium uppercase tracking-wider">Stats</span>
                    <h2 className="text-3xl font-medium lg:text-4xl">
                        Convex Panel <span className="text-gradient-accent">in numbers</span>
                    </h2>
                    <p className="text-muted-foreground">Trusted by developers building with Convex</p>
                </div>

                {!isLoading ? (
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="stats-card text-center glow-accent">
                        <div className="icon-container mx-auto mb-4">
                            <Star className="size-5 text-[#34D399]" />
                        </div>
                        <div className="text-4xl lg:text-5xl font-bold text-gradient-accent mb-2">
                            {githubStars.toLocaleString()}
                        </div>
                        <p className="text-muted-foreground text-sm">Stars on GitHub</p>
                    </div>
                    <div className="stats-card text-center">
                        <div className="icon-container mx-auto mb-4">
                            <TrendingUp className="size-5 text-[#34D399]" />
                        </div>
                        <div className="text-4xl lg:text-5xl font-bold text-gradient-accent mb-2">
                            {npmStats.downloads.toLocaleString()}
                        </div>
                        <p className="text-muted-foreground text-sm">Weekly Downloads</p>
                    </div>
                    <div className="stats-card text-center">
                        <div className="icon-container mx-auto mb-4">
                            <Download className="size-5 text-[#34D399]" />
                        </div>
                        <div className="text-4xl lg:text-5xl font-bold text-gradient-accent mb-2">
                            {totalDownloads.toLocaleString()}
                        </div>
                        <p className="text-muted-foreground text-sm">Total Downloads</p>
                    </div>
                </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="stats-card text-center animate-pulse">
                                <div className="icon-container mx-auto mb-4 opacity-50">
                                    <div className="size-5 bg-muted rounded" />
                                </div>
                                <div className="h-12 bg-muted rounded w-24 mx-auto mb-2" />
                                <div className="h-4 bg-muted rounded w-20 mx-auto" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
