import { CalendarClock, Pause, PlayCircle } from 'lucide-react';
import { FeaturePanel } from '../../components/FeaturePanel';

const schedules = [
    { name: 'cron/rebuildSearch', cadence: '*/15 * * * *', next: 'in 12m', status: 'running' },
    { name: 'cron/purgeSessions', cadence: '0 */6 * * *', next: 'in 2h', status: 'running' },
    { name: 'cron/dailyReport', cadence: '0 9 * * *', next: 'tomorrow', status: 'paused' },
];

export function SchedulesView() {
    return (
        <div className="feature-grid">
            <FeaturePanel
                title="Schedules"
                subtitle="Cron and recurring jobs"
                actions={<span className="chip"><CalendarClock size={14} /> UTC</span>}
            >
                <div className="table-like">
                    {schedules.map((job) => (
                        <div className="row" key={job.name}>
                            <div className="cell cell--wide">
                                <div className="pill">{job.name}</div>
                            </div>
                            <div className="cell">{job.cadence}</div>
                            <div className="cell">{job.next}</div>
                            <div className="cell">
                                <span className={`chip chip--${job.status === 'paused' ? 'muted' : 'good'}`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </FeaturePanel>

            <FeaturePanel title="Controls" subtitle="Read-only placeholder" dense>
                <div className="button-row">
                    <button className="btn"><PlayCircle size={14} /> Resume</button>
                    <button className="btn btn-ghost"><Pause size={14} /> Pause</button>
                </div>
            </FeaturePanel>
        </div>
    );
}
