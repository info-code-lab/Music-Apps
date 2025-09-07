import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  Bell,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  Server,
  Users,
  Music,
  Globe
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().min(1, "Site description is required"),
  contactEmail: z.string().email("Must be a valid email"),
  maintenanceMode: z.boolean(),
  allowRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
});

const securitySettingsSchema = z.object({
  maxLoginAttempts: z.number().min(1).max(10),
  sessionTimeout: z.number().min(5).max(1440), // minutes
  enableTwoFactor: z.boolean(),
  passwordMinLength: z.number().min(6).max(50),
  requireStrongPasswords: z.boolean(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  newUserNotifications: z.boolean(),
  uploadNotifications: z.boolean(),
  systemAlerts: z.boolean(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsData = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);

  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "Harmony Music Platform",
      siteDescription: "A modern music streaming and sharing platform",
      contactEmail: "admin@harmony.com",
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
    },
  });

  const securityForm = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      maxLoginAttempts: 5,
      sessionTimeout: 60,
      enableTwoFactor: false,
      passwordMinLength: 8,
      requireStrongPasswords: true,
    },
  });

  const notificationForm = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      newUserNotifications: true,
      uploadNotifications: true,
      systemAlerts: true,
    },
  });

  const updateGeneralMutation = useMutation({
    mutationFn: async (data: GeneralSettingsData) => {
      setIsLoading(true);
      await apiRequest("PUT", "/api/admin/settings/general", data);
    },
    onSuccess: () => {
      toast.success("General settings updated successfully");
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to update general settings");
      setIsLoading(false);
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: SecuritySettingsData) => {
      setIsLoading(true);
      await apiRequest("PUT", "/api/admin/settings/security", data);
    },
    onSuccess: () => {
      toast.success("Security settings updated successfully");
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to update security settings");
      setIsLoading(false);
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (data: NotificationSettingsData) => {
      setIsLoading(true);
      await apiRequest("PUT", "/api/admin/settings/notifications", data);
    },
    onSuccess: () => {
      toast.success("Notification settings updated successfully");
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to update notification settings");
      setIsLoading(false);
    },
  });

  const systemStatus = [
    { label: "Server Status", value: "Online", icon: Server, color: "text-green-600", status: "healthy" },
    { label: "Database", value: "Connected", icon: Database, color: "text-green-600", status: "healthy" },
    { label: "Storage", value: "67% Used", icon: Database, color: "text-yellow-600", status: "warning" },
    { label: "API Status", value: "Operational", icon: Globe, color: "text-green-600", status: "healthy" },
  ];

  const platformStats = [
    { label: "Total Users", value: "2,847", icon: Users },
    { label: "Total Tracks", value: "15,632", icon: Music },
    { label: "Storage Used", value: "1.2 TB", icon: Database },
    { label: "API Calls Today", value: "45,231", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20">
            <Server className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStatus.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    stat.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/20' :
                    stat.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Tabs */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Manage your platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general" className="gap-2">
                    <Globe className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit((data) => updateGeneralMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
                          name="siteName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter site name" {...field} data-testid="site-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={generalForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="admin@example.com" {...field} data-testid="contact-email-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={generalForm.control}
                        name="siteDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter site description" {...field} data-testid="site-description-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={generalForm.control}
                          name="maintenanceMode"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                <FormDescription>Put the site in maintenance mode</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="maintenance-mode-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="allowRegistration"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Registration</FormLabel>
                                <FormDescription>Allow new users to register</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="allow-registration-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="requireEmailVerification"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Verification</FormLabel>
                                <FormDescription>Require email verification for new accounts</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="email-verification-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full" data-testid="save-general-settings">
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save General Settings
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit((data) => updateSecurityMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={securityForm.control}
                          name="maxLoginAttempts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Login Attempts</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="10" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="max-login-attempts-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={securityForm.control}
                          name="sessionTimeout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Timeout (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="5" 
                                  max="1440" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="session-timeout-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={securityForm.control}
                        name="passwordMinLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Password Length</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="6" 
                                max="50" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="password-min-length-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={securityForm.control}
                          name="enableTwoFactor"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                                <FormDescription>Enable 2FA for admin accounts</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="two-factor-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={securityForm.control}
                          name="requireStrongPasswords"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Strong Passwords</FormLabel>
                                <FormDescription>Require complex passwords with special characters</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="strong-passwords-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full" data-testid="save-security-settings">
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Security Settings
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit((data) => updateNotificationMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>Send notifications via email</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="email-notifications-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Push Notifications</FormLabel>
                                <FormDescription>Send browser push notifications</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="push-notifications-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="newUserNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">New User Notifications</FormLabel>
                                <FormDescription>Notify when new users register</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="new-user-notifications-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="uploadNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Upload Notifications</FormLabel>
                                <FormDescription>Notify when new content is uploaded</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="upload-notifications-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={notificationForm.control}
                          name="systemAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">System Alerts</FormLabel>
                                <FormDescription>Send critical system alerts</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="system-alerts-switch" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full" data-testid="save-notification-settings">
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Notification Settings
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Platform Stats
              </CardTitle>
              <CardDescription>Current platform metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platformStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security Scan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}