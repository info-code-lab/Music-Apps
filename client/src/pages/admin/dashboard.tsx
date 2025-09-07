import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Users, Disc, Upload, TrendingUp, Activity } from "lucide-react";
import type { Track } from "@shared/schema";

export default function AdminDashboard() {
  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Mock data for now since we don't have a users endpoint yet
      return [];
    }
  });

  const stats = [
    {
      title: "Total Tracks",
      value: tracks.length.toString(),
      description: "Music tracks in library",
      icon: Music,
      change: "+12%",
      changeType: "increase" as const,
    },
    {
      title: "Active Users",
      value: "1,234",
      description: "Registered users",
      icon: Users,
      change: "+8%",
      changeType: "increase" as const,
    },
    {
      title: "Albums",
      value: "156",
      description: "Music albums",
      icon: Disc,
      change: "+3%",
      changeType: "increase" as const,
    },
    {
      title: "Monthly Uploads",
      value: "89",
      description: "Tracks uploaded this month",
      icon: Upload,
      change: "+15%",
      changeType: "increase" as const,
    },
  ];

  const recentActivity = [
    { action: "New track uploaded", item: "Midnight Jazz", time: "2 hours ago" },
    { action: "User registered", item: "john_doe", time: "4 hours ago" },
    { action: "Album created", item: "Summer Vibes", time: "6 hours ago" },
    { action: "Track favorited", item: "Electronic Dreams", time: "8 hours ago" },
    { action: "New artist added", item: "Luna Collective", time: "12 hours ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </span>
                  {" from last month"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions on your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.item}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                data-testid="quick-upload-track"
              >
                <Upload className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-600">Upload Track</p>
              </button>
              
              <button 
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                data-testid="quick-add-user"
              >
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-600">Add User</p>
              </button>
              
              <button 
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                data-testid="quick-create-album"
              >
                <Disc className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600">Create Album</p>
              </button>
              
              <button 
                className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                data-testid="quick-manage-artists"
              >
                <Music className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-600">Manage Artists</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}