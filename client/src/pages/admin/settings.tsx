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
  AlertTriangle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().min(1, "Site description is required"),
  contactEmail: z.string().email("Invalid email address"),
  maxFileSize: z.number().min(1).max(100),
  allowedFormats: z.array(z.string()).min(1, "At least one format must be allowed"),
});

const securitySettingsSchema = z.object({
  requireEmailVerification: z.boolean(),
  maxLoginAttempts: z.number().min(1).max(10),
  sessionTimeout: z.number().min(5).max(1440),
  twoFactorEnabled: z.boolean(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  newUserNotifications: z.boolean(),
  uploadNotifications: z.boolean(),
  systemAlerts: z.boolean(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsData = z.infer<typeof securitySettingsSchema>;
type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");

  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "Harmony Music Platform",
      siteDescription: "A modern music streaming and discovery platform",
      contactEmail: "admin@harmony.com",
      maxFileSize: 50,
      allowedFormats: ["mp3", "wav", "flac"],
    },
  });

  const securityForm = useForm<SecuritySettingsData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      requireEmailVerification: true,
      maxLoginAttempts: 5,
      sessionTimeout: 60,
      twoFactorEnabled: false,
    },
  });

  const notificationForm = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      newUserNotifications: true,
      uploadNotifications: false,
      systemAlerts: true,
    },
  });

  const updateGeneralSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsData) => {
      const response = await apiRequest("PUT", "/api/admin/settings/general", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("General settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update general settings");
    },
  });

  const updateSecuritySettingsMutation = useMutation({
    mutationFn: async (data: SecuritySettingsData) => {
      const response = await apiRequest("PUT", "/api/admin/settings/security", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Security settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update security settings");
    },
  });

  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettingsData) => {
      const response = await apiRequest("PUT", "/api/admin/settings/notifications", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Notification settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update notification settings");
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/cache/clear");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Cache cleared successfully");
    },
    onError: () => {
      toast.error("Failed to clear cache");
    },
  });

  const optimizeDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/database/optimize");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Database optimized successfully");
    },
    onError: () => {
      toast.error("Failed to optimize database");
    },
  });

  const handleGeneralSubmit = (data: GeneralSettingsData) => {
    updateGeneralSettingsMutation.mutate(data);
  };

  const handleSecuritySubmit = (data: SecuritySettingsData) => {
    updateSecuritySettingsMutation.mutate(data);
  };

  const handleNotificationSubmit = (data: NotificationSettingsData) => {
    updateNotificationSettingsMutation.mutate(data);
  };

  const formatOptions = [
    { value: "mp3", label: "MP3" },
    { value: "wav", label: "WAV" },
    { value: "flac", label: "FLAC" },
    { value: "aac", label: "AAC" },
    { value: "ogg", label: "OGG" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure platform settings and preferences</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Security</p>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Secure
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Palette className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Theme</p>
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Dark
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
          <CardDescription>Manage your platform settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-site-name" />
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
                            <Input type="email" {...field} data-testid="input-contact-email" />
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
                          <Textarea {...field} rows={3} data-testid="textarea-site-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="maxFileSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max File Size (MB)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-max-file-size"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="allowedFormats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowed Formats</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {formatOptions.map((format) => (
                                <div key={format.value} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={format.value}
                                    checked={field.value.includes(format.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, format.value]);
                                      } else {
                                        field.onChange(field.value.filter((v) => v !== format.value));
                                      }
                                    }}
                                    data-testid={`checkbox-format-${format.value}`}
                                  />
                                  <label htmlFor={format.value} className="text-sm">
                                    {format.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateGeneralSettingsMutation.isPending}
                    data-testid="button-save-general"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateGeneralSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="requireEmailVerification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Verification</FormLabel>
                            <FormDescription>
                              Require users to verify their email address during registration
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-email-verification"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="twoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Enable two-factor authentication for admin accounts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-two-factor"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-max-login-attempts"
                            />
                          </FormControl>
                          <FormDescription>
                            Number of failed login attempts before account lockout
                          </FormDescription>
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
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-session-timeout"
                            />
                          </FormControl>
                          <FormDescription>
                            Automatic logout after inactivity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateSecuritySettingsMutation.isPending}
                    data-testid="button-save-security"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {updateSecuritySettingsMutation.isPending ? "Saving..." : "Save Security Settings"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Send email notifications for important events
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-email-notifications"
                            />
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
                            <FormDescription>
                              Get notified when new users register
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-new-user-notifications"
                            />
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
                            <FormDescription>
                              Get notified when users upload new content
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-upload-notifications"
                            />
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
                            <FormDescription>
                              Receive critical system alerts and warnings
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-system-alerts"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateNotificationSettingsMutation.isPending}
                    data-testid="button-save-notifications"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {updateNotificationSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Maintenance */}
            <TabsContent value="maintenance" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Maintenance Operations</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Clear Cache</CardTitle>
                      <CardDescription>
                        Clear application cache to improve performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => clearCacheMutation.mutate()}
                        disabled={clearCacheMutation.isPending}
                        variant="outline"
                        data-testid="button-clear-cache"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${clearCacheMutation.isPending ? 'animate-spin' : ''}`} />
                        {clearCacheMutation.isPending ? "Clearing..." : "Clear Cache"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Optimize Database</CardTitle>
                      <CardDescription>
                        Run database optimization and cleanup procedures
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => optimizeDatabaseMutation.mutate()}
                        disabled={optimizeDatabaseMutation.isPending}
                        variant="outline"
                        data-testid="button-optimize-database"
                      >
                        <Database className={`h-4 w-4 mr-2 ${optimizeDatabaseMutation.isPending ? 'animate-spin' : ''}`} />
                        {optimizeDatabaseMutation.isPending ? "Optimizing..." : "Optimize Database"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Platform Version:</span> 1.0.0
                      </div>
                      <div>
                        <span className="font-medium">Database Version:</span> PostgreSQL 15.2
                      </div>
                      <div>
                        <span className="font-medium">Last Backup:</span> 2 hours ago
                      </div>
                      <div>
                        <span className="font-medium">Storage Used:</span> 12.5 GB / 100 GB
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}