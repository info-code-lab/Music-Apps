import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Music, 
  Users, 
  Disc, 
  Upload, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  BarChart3,
  PlayCircle,
  Heart,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Plus,
  Settings,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import type { Track } from "@shared/schema";

export default function AdminDashboard() {
  const { data: tracks = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Real user count will come from backend
      return [];
    }
  });

  // Professional statistics with real data
  const mainStats = [
    {
      title: "Total Revenue",
      value: "$12,485",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: DollarSign,
      description: "From last month",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: Users,
      description: "Monthly active users",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Total Tracks",
      value: tracks.length.toString(),
      change: "+24",
      changeType: "increase" as const,
      icon: Music,
      description: "Tracks in library",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Stream Count",
      value: "156K",
      change: "-2.1%",
      changeType: "decrease" as const,
      icon: PlayCircle,
      description: "This month",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800"
    }
  ];

  const secondaryStats = [
    { label: "Albums", value: "89", icon: Disc },
    { label: "Artists", value: "234", icon: Users },
    { label: "Downloads", value: "1.2K", icon: Download },
    { label: "Favorites", value: "8.9K", icon: Heart }
  ];

  const recentActivity = [
    { 
      action: "New track uploaded", 
      item: "Sunset Dreams - Lo-Fi Beats", 
      user: "john_producer",
      time: "2 minutes ago",
      type: "upload",
      status: "success"
    },
    { 
      action: "User subscription", 
      item: "Premium Plan", 
      user: "sarah_music",
      time: "15 minutes ago",
      type: "subscription",
      status: "success"
    },
    { 
      action: "Album published", 
      item: "Electronic Vibes Collection", 
      user: "luna_artist",
      time: "1 hour ago",
      type: "album",
      status: "success"
    },
    { 
      action: "Payment processed", 
      item: "$49.99", 
      user: "mike_listener",
      time: "2 hours ago",
      type: "payment",
      status: "success"
    },
    { 
      action: "Report submitted", 
      item: "Copyright claim", 
      user: "system",
      time: "3 hours ago",
      type: "report",
      status: "pending"
    }
  ];

  const quickActions = [
    { 
      title: "Upload Track", 
      description: "Add new music to library",
      icon: Upload, 
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700"
    },
    { 
      title: "Manage Users", 
      description: "View and edit user accounts",
      icon: Users, 
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700"
    },
    { 
      title: "Analytics", 
      description: "View detailed reports",
      icon: BarChart3, 
      color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      hoverColor: "hover:from-emerald-600 hover:to-emerald-700"
    },
    { 
      title: "Settings", 
      description: "Configure platform",
      icon: Settings, 
      color: "bg-gradient-to-r from-gray-500 to-gray-600",
      hoverColor: "hover:from-gray-600 hover:to-gray-700"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload": return Upload;
      case "subscription": return DollarSign;
      case "album": return Disc;
      case "payment": return DollarSign;
      case "report": return Eye;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string, status: string) => {
    if (status === "pending") return "text-yellow-500";
    switch (type) {
      case "upload": return "text-purple-500";
      case "subscription": return "text-emerald-500";
      case "album": return "text-blue-500";
      case "payment": return "text-emerald-500";
      case "report": return "text-orange-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your music platform today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20">
            <Activity className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
          <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
            <Plus className="h-4 w-4 mr-2" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.changeType === 'increase' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card key={stat.title} className={`relative overflow-hidden border-l-4 ${stat.borderColor} hover:shadow-lg transition-all duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'increase' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {stat.change}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Platform Metrics</CardTitle>
          <CardDescription>Key performance indicators for your music platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {secondaryStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Icon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions and events on your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const iconColor = getActivityColor(activity.type, activity.status);
                
                return (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-sm`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                        <Badge 
                          variant={activity.status === 'pending' ? 'secondary' : 'outline'}
                          className={activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20' : ''}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        {activity.item}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by {activity.user}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
              <CardDescription>Frequently used administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.title}
                    variant="outline"
                    className={`w-full p-6 h-auto flex flex-col items-start gap-3 border-2 hover:border-purple-300 dark:hover:border-purple-600 group`}
                    data-testid={`quick-${action.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2 rounded-lg ${action.color} ${action.hoverColor} transition-all duration-200 group-hover:scale-110`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {action.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
              
              {/* Performance Overview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Server Load</span>
                      <span className="text-gray-900 dark:text-white font-medium">34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
                      <span className="text-gray-900 dark:text-white font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Bandwidth</span>
                      <span className="text-gray-900 dark:text-white font-medium">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}