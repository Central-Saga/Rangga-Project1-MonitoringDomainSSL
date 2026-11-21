import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  fallback: ReactNode;
  children?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    console.error('Error caught by ErrorBoundary:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children ?? null;
  }
}
