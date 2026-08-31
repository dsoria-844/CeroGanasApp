import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 select-none">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl mb-4 shadow-sm">
            🦥
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Algo no salió como esperábamos</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'Ocurrió un error inesperado al renderizar la aplicación.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer transition-transform active:scale-95"
          >
            Recargar aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
