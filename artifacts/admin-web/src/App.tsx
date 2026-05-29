import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Requests from "@/pages/requests/index";
import RequestDetail from "@/pages/requests/[id]";
import Announcements from "@/pages/announcements/index";
import AnnouncementForm from "@/pages/announcements/form";
import UsersList from "@/pages/users/index";
import UserDetail from "@/pages/users/[id]";
import PendingApprovals from "@/pages/users/pending";
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

// Flat routing — no nested Switch. More-specific paths before less-specific ones
// so Wouter's prefix matching doesn't swallow sub-routes.
function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/login" component={Login} />

      {/* Requests — detail before list */}
      <Route path="/requests/:id">
        <Layout><RequestDetail /></Layout>
      </Route>
      <Route path="/requests">
        <Layout><Requests /></Layout>
      </Route>

      {/* Announcements — /new and /:id/edit before base */}
      <Route path="/announcements/new">
        <Layout><AnnouncementForm /></Layout>
      </Route>
      <Route path="/announcements/:id/edit">
        <Layout><AnnouncementForm /></Layout>
      </Route>
      <Route path="/announcements">
        <Layout><Announcements /></Layout>
      </Route>

      {/* Users — pending before detail before list */}
      <Route path="/users/pending">
        <Layout><PendingApprovals /></Layout>
      </Route>
      <Route path="/users/:id">
        <Layout><UserDetail /></Layout>
      </Route>
      <Route path="/users">
        <Layout><UsersList /></Layout>
      </Route>

      {/* Other protected routes */}
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>

      {/* Root redirect */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* 404 */}
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
