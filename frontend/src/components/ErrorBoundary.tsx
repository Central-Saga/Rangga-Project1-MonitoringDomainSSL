import { Component, ReactNode, useState, useEffect } from 'react';

type ErrorBoundaryProps = {
  fallback: ReactNode;
  onError?: (error: Error, info: string) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: string) {
    // Log error ke monitoring service
    if (this.props.onError) {
      this.props.onError(error, info);
    }
    // Log ke console (ditingkatkan ke Sentry/Bugsnag di production)
    console.error('Error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}