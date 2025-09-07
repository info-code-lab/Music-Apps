import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Switch, Route } from "wouter";
import AdminLayout from "@/components/admin-layout";
import AdminDashboard from "./admin/dashboard";
import TracksManagement from "./admin/tracks";
import ArtistsManagement from "./admin/artists";
import AlbumsManagement from "./admin/albums";
import UsersManagement from "./admin/users";
import UploadManagement from "./admin/upload";
import AdminSettings from "./admin/settings";

export default function Admin() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLocation("/admin/login");
    }
  }, [user, setLocation]);

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
        <Route path="/admin/users" component={UsersManagement} />
        <Route path="/admin/upload" component={UploadManagement} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={AdminDashboard} />
      </Switch>
    </AdminLayout>
  );
}