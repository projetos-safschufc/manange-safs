import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar erros de renderização e exibir mensagem
 * em vez de tela em branco (útil para debug em dev e fallback em prod).
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 800,
            margin: '40px auto',
            background: '#fff5f5',
            border: '1px solid #fc8181',
            borderRadius: 8,
          }}
        >
          <h2 style={{ color: '#c53030', marginTop: 0 }}>
            Algo deu errado ao carregar a aplicação
          </h2>
          <p style={{ color: '#742a2a' }}>{this.state.error.message}</p>
          {isDev && this.state.errorInfo && (
            <pre
              style={{
                overflow: 'auto',
                fontSize: 12,
                background: '#2d3748',
                color: '#e2e8f0',
                padding: 16,
                borderRadius: 4,
              }}
            >
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          {isDev && (
            <p style={{ fontSize: 12, color: '#718096' }}>
              Verifique o console do navegador (F12) para mais detalhes.
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
