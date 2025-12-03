import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '2rem',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                }}>
                    <h1 style={{ marginBottom: '1rem' }}>Something went wrong</h1>
                    <p style={{ marginBottom: '2rem', color: '#999' }}>
                        The application encountered an unexpected error.
                    </p>
                    {this.state.error && (
                        <details style={{
                            backgroundColor: '#2a2a2a',
                            padding: '1rem',
                            borderRadius: '4px',
                            maxWidth: '600px',
                            width: '100%',
                        }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                                Error Details
                            </summary>
                            <pre style={{
                                overflow: 'auto',
                                fontSize: '0.875rem',
                                color: '#ff6b6b',
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo && (
                                    <>
                                        {'\n\n'}
                                        {this.state.errorInfo.componentStack}
                                    </>
                                )}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#4a9eff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
