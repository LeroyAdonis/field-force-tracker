import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches rendering errors in child components
 * and displays a friendly error UI instead of a blank screen.
 *
 * Note: Error boundaries require class components per React API.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <a href="/">Go Home</a>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Pre-configured page-level error boundary with default styling.
 * Wrap individual page content with this for per-page error isolation.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Page Error</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              This page encountered an error. Please try again or go back to the home page.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <a href="/">Go Home</a>
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
