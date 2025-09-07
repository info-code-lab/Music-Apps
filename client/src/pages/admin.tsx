import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
  if (!user || user.role !== ('admin' as const)) {
    setLocation("/admin/login");
    return null;
  }

  // Route to specific admin page based on location
  const renderPage = () => {
    switch (location) {
      case "/admin":
        return <AdminDashboard />;
      case "/admin/tracks":
        return <TracksManagement />;
      case "/admin/artists":
        return <ArtistsManagement />;
      case "/admin/albums":
        return <AlbumsManagement />;
      case "/admin/users":
        return <UsersManagement />;
      case "/admin/upload":
        return <UploadManagement />;
      case "/admin/settings":
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout>
      {renderPage()}
    </AdminLayout>
  );
}