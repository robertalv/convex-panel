import { Clock3, Code2, GitCommitHorizontal, Rocket } from "lucide-react";
import { FeaturePanel } from "../../components/FeaturePanel";
import { OpenInEditorButton } from "../../components/OpenInEditor";

const functions = [
  {
    name: "queries/users",
    lastDeploy: "2h ago",
    source: "convex/functions/users.ts",
    type: "query",
  },
  {
    name: "mutations/updateProfile",
    lastDeploy: "1d ago",
    source: "convex/functions/users.ts",
    type: "mutation",
  },
  {
    name: "actions/sendEmail",
    lastDeploy: "10m ago",
    source: "convex/actions/email.ts",
    type: "action",
  },
];

export function FunctionsView() {
  return (
    <div className="feature-grid">
      <FeaturePanel
        title="Functions"
        subtitle="Queries, mutations, actions, and HTTP"
        actions={
          <span className="chip">
            <Code2 size={14} /> source-linked
          </span>
        }
      >
        <div className="table-like">
          {functions.map((fn) => (
            <div className="row" key={fn.name}>
              <div className="cell cell--wide">
                <div className="pill">{fn.name}</div>
              </div>
              <div className="cell">
                <Clock3 size={12} /> {fn.lastDeploy}
              </div>
              <div className="cell flex items-center gap-1">
                {fn.source}
                <OpenInEditorButton filePath={fn.source} iconOnly size="sm" />
              </div>
              <div className="cell">
                <span
                  className={`chip chip--${fn.type === "mutation" ? "warn" : "muted"}`}
                >
                  {fn.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FeaturePanel>

      <FeaturePanel
        title="Recent pushes"
        subtitle="Latest deploy metadata"
        dense
      >
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-icon">
              <Rocket size={14} />
            </div>
            <div>
              <div className="timeline-title">Preview build deployed</div>
              <div className="timeline-detail">
                feature/auth-refactor • 6 minutes ago
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-icon">
              <GitCommitHorizontal size={14} />
            </div>
            <div>
              <div className="timeline-title">Compiled 12 functions</div>
              <div className="timeline-detail">main • 1 hour ago</div>
            </div>
          </div>
        </div>
      </FeaturePanel>
    </div>
  );
}
