import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { MusicPlayerProvider } from "@/hooks/use-music-player";
import GlobalMusicPlayer from "./components/global-music-player";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Artists from "@/pages/artists";
import Albums from "@/pages/albums";
import Playlists from "@/pages/playlists";
import Songs from "@/pages/songs";
import Favorites from "@/pages/favorites";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/songs" component={Songs} />
      <Route path="/artists" component={Artists} />
      <Route path="/albums" component={Albums} />
      <Route path="/playlists" component={Playlists} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/profile" component={Profile} />
      <Route path="/search" component={Search} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/dashboard" component={Admin} />
      <Route path="/admin/tracks" component={Admin} />
      <Route path="/admin/artists" component={Admin} />
      <Route path="/admin/albums" component={Admin} />
      <Route path="/admin/categories" component={Admin} />
      <Route path="/admin/users" component={Admin} />
      <Route path="/admin/upload" component={Admin} />
      <Route path="/admin/settings" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MusicPlayerProvider>
          <TooltipProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
            />
            <Router />
            <GlobalMusicPlayer />
          </TooltipProvider>
        </MusicPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
