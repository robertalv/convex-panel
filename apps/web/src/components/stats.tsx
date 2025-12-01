"use client"

import { useEffect, useState } from 'react';

const fetchNpmPackageDownloadCount = async (name: string, created: number) => {
  // The dates accepted in the endpoint url and returned in the data
  // are date-only ISO's, eg., `2024-01-01`, so we use that format
  // for all dates in this function
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
                // Get the date for 7 days ago for weekly downloads
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
                
                // Fetch total download count
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
        <section className="py-12 md:py-20">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
                    <h2 className="text-4xl font-medium lg:text-5xl">Convex Panel in numbers</h2>
                    <p>Convex Panel is a tool that helps developers use their Convex database within their applications.</p>
                </div>

                {!isLoading ? (
                <div className="grid gap-12 divide-y *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0">
                    <div className="space-y-4">
                        <div className="text-5xl font-bold">
                            {githubStars.toLocaleString()}
                        </div>
                        <p>Stars on GitHub</p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-5xl font-bold">{npmStats.downloads.toLocaleString()}</div>
                        <p>Weekly Downloads</p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-5xl font-bold">{totalDownloads.toLocaleString()}</div>
                        <p>Total Downloads</p>
                    </div>
                </div>
                ) : (
                    <div className="grid gap-12 divide-y *:text-center md:grid-cols-3 md:gap-2 md:divide-x md:divide-y-0">
                        <div className="space-y-4">
                            <div className="text-5xl font-bold">
                                Loading...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
