import { FileDown, Filter, TerminalSquare } from 'lucide-react';
import { FeaturePanel } from '../../components/FeaturePanel';

const logs = [
    { level: 'info', message: 'mutation:updateProfile resolved', ts: '12:01:12' },
    { level: 'warn', message: 'Action slow path triggered (sendEmail)', ts: '12:00:44' },
    { level: 'error', message: 'AuthError: invalid token signature', ts: '11:59:10' },
];

export function LogsView() {
    return (
        <div className="feature-grid">
            <FeaturePanel
                title="Logs"
                subtitle="Streaming tail"
                actions={<span className="chip"><Filter size={14} /> filters</span>}
            >
                <div className="log-viewer">
                    {logs.map((log, idx) => (
                        <div className={`log-line log-line--${log.level}`} key={idx}>
                            <span className="log-ts">{log.ts}</span>
                            <span className="log-level">{log.level}</span>
                            <span className="log-msg">{log.message}</span>
                        </div>
                    ))}
                </div>
            </FeaturePanel>

            <FeaturePanel title="Export" subtitle="Save to file via Tauri" dense>
                <div className="button-row">
                    <button className="btn"><FileDown size={14} /> Export visible</button>
                    <button className="btn btn-ghost"><TerminalSquare size={14} /> Stream</button>
                </div>
            </FeaturePanel>
        </div>
    );
}
