/**
 * App.tsx
 *
 * Root application component for the VORTREXYN Hangman marketing website.
 *
 * ── Routing ──────────────────────────────────────────────────────────────
 * Uses Wouter (a lightweight React router) with a base path read from
 * import.meta.env.BASE_URL (set by Vite from the BASE_PATH env var).
 * The trailing slash is stripped from the base so Wouter's path matching
 * works correctly (e.g. "/vortrexyn-web" not "/vortrexyn-web/").
 *
 * Routes:
 *   /          → Home page (landing / download page)
 *   /privacy   → Privacy Policy page
 *   *          → 404 Not Found fallback
 *
 * ── Data fetching ────────────────────────────────────────────────────────
 * React Query is set up at the root so any page can use hooks like
 * useQuery / useMutation if server-side data is ever added.
 * Currently the site is fully static — no queries are made.
 */
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
