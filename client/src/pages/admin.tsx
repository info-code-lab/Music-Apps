import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Switch, Route } from "wouter";
import AdminLayout from "@/components/admin-layout";
import AdminDashboard from "./admin/dashboard";
import TracksManagement from "./admin/tracks";
import ArtistsManagement from "./admin/artists";
import AlbumsManagement from "./admin/albums";
import CategoriesManagement from "./admin/categories";
import UsersManagement from "./admin/users";
import UploadManagement from "./admin/upload";
import AdminSettings from "./admin/settings";

export default function Admin() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect if not admin (but only after loading is complete)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin (after loading is complete)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/tracks" component={TracksManagement} />
        <Route path="/admin/artists" component={ArtistsManagement} />
        <Route path="/admin/albums" component={AlbumsManagement} />
        <Route path="/admin/categories" component={CategoriesManagement} />
        <Route path="/admin/users" component={UsersManagement} />
        <Route path="/admin/upload" component={UploadManagement} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={AdminDashboard} />
      </Switch>
    </AdminLayout>
  );
}