import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
          <div className="text-destructive text-5xl">⚠</div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <pre className="text-xs text-muted-foreground bg-muted p-4 rounded-md max-w-xl overflow-auto text-left whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <Button onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
