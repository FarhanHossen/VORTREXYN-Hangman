/**
 * components/ErrorBoundary.tsx
 *
 * React class-based error boundary for VORTREXYN Hangman.
 *
 * Why a class component?
 * Error boundaries *must* be class components because the two lifecycle methods
 * that enable error-boundary behaviour — `getDerivedStateFromError` and
 * `componentDidCatch` — are only available on class components.  React does not
 * (yet) provide functional equivalents.
 * Reference: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * Behaviour:
 *  - When any descendant component throws during render, `getDerivedStateFromError`
 *    captures the error and triggers a re-render with `state.error` set.
 *  - `render()` checks `state.error`: if an error exists, it renders the
 *    `FallbackComponent` (default: `ErrorFallback`) instead of the children.
 *  - The optional `onError` prop lets callers log the error to an external
 *    service (e.g. Sentry) via `componentDidCatch`.
 *  - `resetError` clears the error state so the UI can attempt recovery
 *    (e.g. after the user taps "Try Again" in ErrorFallback).
 */

import React, { Component, ComponentType, PropsWithChildren } from "react";

import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";

/** Props accepted by ErrorBoundary. */
export type ErrorBoundaryProps = PropsWithChildren<{
  /** Custom fallback component to render instead of ErrorFallback. */
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Optional callback — called with the error and component stack when an error is caught. */
  onError?: (error: Error, stackTrace: string) => void;
}>;

/** Internal state — tracks the caught error (null when there is no error). */
type ErrorBoundaryState = { error: Error | null };

/**
 * ErrorBoundary
 *
 * Must be a class component — see file-level comment for why.
 * Wrap any subtree you want to protect:
 *
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  /** Default to the built-in ErrorFallback if no custom component is provided. */
  static defaultProps: {
    FallbackComponent: ComponentType<ErrorFallbackProps>;
  } = {
    FallbackComponent: ErrorFallback,
  };

  /**
   * getDerivedStateFromError
   * Static lifecycle — called synchronously when a descendant throws.
   * Returns the new state that triggers a re-render with the fallback UI.
   * Must be static because React calls it without a component instance.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /**
   * componentDidCatch
   * Called after the render phase has recovered (i.e. after getDerivedStateFromError).
   * Use this for side effects like logging — not for updating state.
   * `info.componentStack` is the React component hierarchy as a string.
   */
  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  /**
   * resetError
   * Clears the stored error, allowing the children to render again.
   * Passed as a prop to the FallbackComponent so the user can tap "Try Again".
   */
  resetError = (): void => {
    this.setState({ error: null });
  };

  /**
   * render
   * If an error is stored, render the fallback UI.
   * Otherwise, render the children normally.
   */
  render() {
    const { FallbackComponent } = this.props;

    return this.state.error && FallbackComponent ? (
      <FallbackComponent
        error={this.state.error}
        resetError={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}
