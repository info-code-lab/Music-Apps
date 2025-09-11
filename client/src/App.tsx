import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { MusicPlayerProvider } from "@/hooks/use-music-player";
import { useSearch } from "@/hooks/use-search";
import GlobalMusicPlayer from "./components/global-music-player";
import MainLayout from "@/components/main-layout";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import Artists from "@/pages/artists";
import Albums from "@/pages/albums";
import Playlists from "@/pages/playlists";
import Songs from "@/pages/songs";
import Favorites from "@/pages/favorites";
import MyLibrary from "@/pages/my-library";
import NewReleases from "@/pages/new-releases";
import TopCharts from "@/pages/top-charts";
import TopPlaylists from "@/pages/top-playlists";
import TopArtists from "@/pages/top-artists";
import Profile from "@/pages/profile";
import Search from "@/pages/search";
import History from "@/pages/history";
import OnboardingLanguage from "@/pages/onboarding-language";
import OnboardingArtists from "@/pages/onboarding-artists";
import NotFound from "@/pages/not-found";

function Router() {
  const { searchQuery, handleSearch, searchResults } = useSearch();

  return (
    <Switch>
      {/* Main app routes with floating sidebar */}
      <Route path="/">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Home searchQuery={searchQuery} onSearch={handleSearch} searchResults={searchResults} />
        </MainLayout>
      </Route>
      <Route path="/songs">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Songs />
        </MainLayout>
      </Route>
      <Route path="/artists">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Artists />
        </MainLayout>
      </Route>
      <Route path="/albums">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Albums />
        </MainLayout>
      </Route>
      <Route path="/playlists">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Playlists />
        </MainLayout>
      </Route>
      <Route path="/favorites">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Favorites />
        </MainLayout>
      </Route>
      <Route path="/my-library">
        <MainLayout showSearch={false}>
          <MyLibrary />
        </MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout showSearch={false}>
          <Profile />
        </MainLayout>
      </Route>
      <Route path="/search">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <Search />
        </MainLayout>
      </Route>
      <Route path="/new-releases">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <NewReleases />
        </MainLayout>
      </Route>
      <Route path="/top-charts">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <TopCharts />
        </MainLayout>
      </Route>
      <Route path="/top-playlists">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <TopPlaylists />
        </MainLayout>
      </Route>
      <Route path="/top-artists">
        <MainLayout onSearch={handleSearch} searchQuery={searchQuery}>
          <TopArtists />
        </MainLayout>
      </Route>
      <Route path="/history">
        <MainLayout showSearch={false}>
          <History />
        </MainLayout>
      </Route>
      
      {/* Onboarding routes without main layout */}
      <Route path="/onboarding/language" component={OnboardingLanguage} />
      <Route path="/onboarding/artists" component={OnboardingArtists} />
      
      {/* Admin routes without floating sidebar */}
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
