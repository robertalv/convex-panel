import React from 'react';
import classNames from 'classnames';

interface FeaturePanelProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    dense?: boolean;
    children?: React.ReactNode;
}

export function FeaturePanel({ title, subtitle, actions, dense, children }: FeaturePanelProps) {
    return (
        <section className={classNames('panel-surface', dense && 'panel-surface--dense')}>
            <header className="panel-header">
                <div>
                    <h2 className="panel-title">{title}</h2>
                    {subtitle && <p className="panel-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="panel-actions">{actions}</div>}
            </header>
            <div className="panel-body">{children}</div>
        </section>
    );
}
