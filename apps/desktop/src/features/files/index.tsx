import { CloudDownload, CloudUpload, FolderClosed, Loader } from 'lucide-react';
import { FeaturePanel } from '../../components/FeaturePanel';

const files = [
    { name: 'design-spec.pdf', size: '2.4 MB', updated: '3h ago' },
    { name: 'assets/banner.png', size: '640 KB', updated: '1d ago' },
    { name: 'logs/archive.zip', size: '14.2 MB', updated: '6d ago' },
];

export function FilesView() {
    return (
        <div className="feature-grid">
            <FeaturePanel
                title="Files"
                subtitle="Convex storage placeholder"
                actions={<span className="chip"><Loader size={14} /> placeholder</span>}
            >
                <div className="list-grid">
                    {files.map((file) => (
                        <div className="list-tile" key={file.name}>
                            <div className="tile-top">
                                <div className="pill">{file.name}</div>
                                <span className="chip chip--muted">{file.size}</span>
                            </div>
                            <div className="tile-meta">{file.updated}</div>
                        </div>
                    ))}
                </div>
            </FeaturePanel>

            <FeaturePanel title="Actions" subtitle="Wire to storage API later" dense>
                <div className="button-row">
                    <button className="btn"><CloudUpload size={14} /> Upload</button>
                    <button className="btn btn-ghost"><CloudDownload size={14} /> Download</button>
                    <button className="btn btn-ghost"><FolderClosed size={14} /> Browse</button>
                </div>
            </FeaturePanel>
        </div>
    );
}
