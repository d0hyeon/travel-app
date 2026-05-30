import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Component } from 'react'
import type { ReactNode } from 'react'

class TestErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { caught: boolean }
> {
  state = { caught: false }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
    this.setState({ caught: true })
  }

  static getDerivedStateFromError() {
    return { caught: true }
  }

  render() {
    if (this.state.caught) return null
    return this.props.children
  }
}

export function createWrapper(options?: { onError?: (error: Error) => void }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestErrorBoundary onError={options?.onError}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </TestErrorBoundary>
    )
  }
}
