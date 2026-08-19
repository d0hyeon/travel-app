
import { Component, type PropsWithChildren, type ReactNode } from 'react';

export type FallbackProps = {
  error: Error;
  resetError: () => void;
};
type ResetKey = string | number | boolean;
type Props = PropsWithChildren<{
  onError?: (error: Error, reset: () => void) => void;
  ignoreError?: (error: Error) => boolean;
  fallback?: ((fallback: FallbackProps) => ReactNode) | null;
  resetKeys?: ResetKey[];
}>;

type State = {
  error: Error | null;
  resetKeys: ResetKey[];
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      error: null,
      resetKeys: props.resetKeys ?? [],
    };
  }

  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    if (!isDeepEqual(props.resetKeys ?? [], state.resetKeys)) {
      return {
        error: null,
        resetKeys: props.resetKeys ?? [],
      };
    }

    return null;
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    const isIgnored = this.props.ignoreError?.(error) ?? false;

    if (isIgnored) {
      throw error;
    }

    this.props.onError?.(error, this.resetError.bind(this));
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

function isDeepEqual(a: Array<ResetKey>, b: Array<ResetKey>) {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
