import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Music, Shield, Upload, Users, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Redirect to admin panel if already logged in as admin
  if (user?.role === 'admin') {
    setLocation("/admin");
    return null;
  }

  // Redirect to home if logged in as regular user
  if (user && user.role !== 'admin') {
    toast.error("Admin access required", {
      icon: '🚫',
      duration: 3000,
    });
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error("Please enter both username and password", {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }

    try {
      await loginMutation.mutateAsync(loginForm);
      // Check if user is admin after login
      if (loginMutation.data?.user?.role === 'admin') {
        setLocation("/admin");
      } else {
        toast.error("Admin access required", {
          icon: '🚫',
          duration: 3000,
        });
      }
    } catch (error) {
      // Error handling is done by the auth hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Hero Section */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Harmony Admin</h1>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Professional Music
              <span className="text-purple-400"> Management</span>
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Secure admin access to manage music content, upload tracks, and control platform operations with enterprise-grade tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Upload className="h-10 w-10 text-blue-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Content Upload</h3>
              <p className="text-sm text-gray-300 text-center">Advanced upload system for files and streaming URLs</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Shield className="h-10 w-10 text-green-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Secure Access</h3>
              <p className="text-sm text-gray-300 text-center">Role-based authentication and permission controls</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Users className="h-10 w-10 text-purple-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Platform Control</h3>
              <p className="text-sm text-gray-300 text-center">Comprehensive user and content management</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your administrator credentials to access the management panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter your admin username"
                  className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  "Access Admin Panel"
                )}
              </Button>
              
              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  Restricted access. Authorized personnel only.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}