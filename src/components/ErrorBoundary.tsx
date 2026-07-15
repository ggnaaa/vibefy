import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm">
            <p className="mb-2 font-bold text-rose-300">Something broke on this screen</p>
            <p className="mb-3 text-[var(--color-mute)]">{this.state.error.message}</p>
            <button
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
