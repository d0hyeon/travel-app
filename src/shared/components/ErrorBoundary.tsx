
import { Component, type PropsWithChildren, type ReactNode } from 'react';

export type FallbackProps = {
  error: Error;
  resetError: () => void;
};
type Props = PropsWithChildren<{
  onError?: (error: Error) => void;
  ignoreError?: (error: Error) => boolean;
  fallback?: ((fallback: FallbackProps) => ReactNode) | null;
  resetKeys?: (string | number | boolean)[];
}>;

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    const isIgnored = this.props.ignoreError?.(error) ?? false;

    if (isIgnored) {
      throw error;
    }
    this.props.onError?.(error);
    this.setState({ error });
  }

  componentDidUpdate(nextProps: Readonly<Props>): void {
    const { resetKeys = [] } = this.props;
    const { resetKeys: nextResetKeys = [] } = nextProps;

    const isUpdatedResetKey =
      resetKeys.length !== nextResetKeys.length || resetKeys.some((key, idx) => key !== nextResetKeys[idx]);

    if (isUpdatedResetKey) {
      this.resetError();
    }
  }

  resetError() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback?.({
        error: this.state.error,
        resetError: this.resetError.bind(this),
      });
    }

    return this.props.children;
  }
}
