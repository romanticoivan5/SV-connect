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
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/requests" component={Requests} />
            <Route path="/requests/:id" component={RequestDetail} />
            <Route path="/announcements" component={Announcements} />
            <Route path="/announcements/new" component={AnnouncementForm} />
            <Route path="/announcements/:id/edit" component={AnnouncementForm} />
            <Route path="/users" component={UsersList} />
            <Route path="/users/:id" component={UserDetail} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
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
