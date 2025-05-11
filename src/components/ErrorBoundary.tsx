import React, { Component, ErrorInfo, ReactNode } from 'react';
import { connect } from 'react-redux';
import { RootState } from '../state/store';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    apiErrors: { [key: string]: string | null };
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    public render() {
        const { hasError, error } = this.state;
        const { children, fallback, apiErrors } = this.props;

        // Check for API errors
        const activeApiErrors = Object.values(apiErrors).filter(Boolean);

        if (hasError || activeApiErrors.length > 0) {
            if (fallback) {
                return fallback;
            }

            return (
                <div className="error-boundary" role="alert">
                    <h2>Something went wrong</h2>
                    {error && (
                        <details>
                            <summary>Error Details</summary>
                            <pre>{error.message}</pre>
                        </details>
                    )}
                    {activeApiErrors.length > 0 && (
                        <div className="api-errors">
                            <h3>API Errors:</h3>
                            <ul>
                                {activeApiErrors.map((err, index) => (
                                    <li key={index}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return children;
    }
}

const mapStateToProps = (state: RootState) => ({
    apiErrors: state.api.errors,
});

export default connect(mapStateToProps)(ErrorBoundary);