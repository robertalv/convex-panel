import { useState } from 'react';
import { Braces, Cpu, Timer } from 'lucide-react';
import { FeaturePanel } from '../../components/feature-panel';

const samplePayload = `{
  "email": "test@example.dev",
  "flags": ["desktop", "beta"]
}`;

export function RunnerView() {
    const [payload, setPayload] = useState(samplePayload);
    const [result, setResult] = useState<string | null>(null);

    const handleRun = () => {
        // Stubbed runner: wire to convex adapter later
        const start = performance.now();
        setTimeout(() => {
            const elapsed = (performance.now() - start).toFixed(1);
            setResult(`Mock run completed in ${elapsed} ms`);
        }, 120);
    };

    return (
        <div className="feature-grid">
            <FeaturePanel
                title="Function Runner"
                subtitle="Call queries, mutations, and actions"
                actions={<span className="chip"><Cpu size={14} /> sandbox</span>}
            >
                <div className="runner-form">
                    <label className="field">
                        <span>Function</span>
                        <select className="input">
                            <option>mutations/updateProfile</option>
                            <option>queries/users</option>
                            <option>actions/sendEmail</option>
                        </select>
                    </label>
                    <label className="field">
                        <span>Payload</span>
                        <textarea
                            className="input code-input"
                            rows={8}
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                        />
                    </label>
                    <div className="runner-actions">
                        <button className="btn" onClick={handleRun}>
                            <Braces size={14} /> Run
                        </button>
                        <button className="btn btn-ghost" onClick={() => setPayload(samplePayload)}>
                            Reset
                        </button>
                    </div>
                </div>
            </FeaturePanel>

            <FeaturePanel title="Result" subtitle="Structured output" dense>
                <div className="result-box">
                    {result ? <div className="result-line"><Timer size={14} /> {result}</div> : 'Awaiting execution…'}
                </div>
            </FeaturePanel>
        </div>
    );
}
