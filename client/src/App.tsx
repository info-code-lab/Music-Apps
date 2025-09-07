import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Artists from "@/pages/artists";
import Albums from "@/pages/albums";
import Playlists from "@/pages/playlists";
import Songs from "@/pages/songs";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/songs" component={Songs} />
      <Route path="/artists" component={Artists} />
      <Route path="/albums" component={Albums} />
      <Route path="/playlists" component={Playlists} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin*" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
