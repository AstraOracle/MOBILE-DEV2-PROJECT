import React from 'react';

/**
 * ErrorBoundary
 * Catches rendering errors and prevents full app crash.
 * Provides better error handling and recovery options.
 */

export default class ErrorBoundary extends React.Component {
    constructor(props){
        super(props);
        this.state = { 
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error){
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo){
        console.error("Error Caught: ", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    }

    render(){
        if (this.state.hasError) {
            return (
                <div className="error-boundary" style={{
                    padding: '20px',
                    margin: '20px',
                    border: '1px solid #dc3545',
                    borderRadius: '8px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                }}>
                    <h2 role="alert">Something went wrong.</h2>
                    <p>Don't worry, your notes are safe. This is just a display error.</p>
                    
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
                            <summary>Error Details (Development Mode)</summary>
                            <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                    
                    <div style={{ marginTop: '15px' }}>
                        <button 
                            onClick={this.handleReset}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{
                                marginLeft: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
