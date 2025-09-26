import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Bell, Shield, Database, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { api } from "@/lib/api";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const { toast } = useToast();
  const { user, token, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("profile");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync tab with URL hash (#appearance, #profile, etc.)
  useEffect(() => {
    const h = location.hash?.replace('#', '') || '';
    const valid: readonly string[] = ["profile", "notifications", "security", "data", "appearance"];
    if (h && valid.includes(h)) {
      setTab(h);
    }
  }, [location.hash]);

  useEffect(() => {
    // Load latest user profile
    (async () => {
      try {
        if (!token) return;
        const me = await api<{ id: string; firstName: string; lastName: string; company: string; email: string; role: string }>(
          '/api/user/me',
          { token }
        );
        setUser({
          id: me.id,
          firstName: me.firstName,
          lastName: me.lastName,
          company: me.company,
          email: me.email,
          role: (me.role as 'publisher' | 'advertiser'),
        });
        (document.getElementById('firstName') as HTMLInputElement).value = me.firstName;
        (document.getElementById('lastName') as HTMLInputElement).value = me.lastName;
        (document.getElementById('email') as HTMLInputElement).value = me.email;
        (document.getElementById('company') as HTMLInputElement).value = me.company;
      } catch (e) {
        // Non-fatal
        console.warn(e);
      }
    })();
  }, [token, setUser]);

  const handleSave = async () => {
    try {
      if (!token) return;
      const payload = {
        firstName: (document.getElementById('firstName') as HTMLInputElement).value,
        lastName: (document.getElementById('lastName') as HTMLInputElement).value,
        email: (document.getElementById('email') as HTMLInputElement).value,
        company: (document.getElementById('company') as HTMLInputElement).value,
      };
      const updated = await api<{ id: string; firstName: string; lastName: string; company: string; email: string; role: string }>(
        '/api/user/me',
        { method: 'PUT', body: payload, token }
      );
      setUser({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        company: updated.company,
        email: updated.email,
        role: (updated.role as 'publisher' | 'advertiser'),
      });
      toast({ title: 'Settings saved', description: 'Your profile was updated.' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); navigate(`#${v}`); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Sarah" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Chen" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="sarah@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Your Company" />
              </div>
              <Button onClick={handleSave} className="bg-gradient-mixed hover:opacity-90">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications and updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Campaign Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about campaign performance
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Matching Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts for new publisher-advertiser matches
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button
                onClick={async () => {
                  try {
                    if (!token) return;
                    const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
                    const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
                    const confirm = (document.getElementById('confirmPassword') as HTMLInputElement).value;
                    if (newPassword !== confirm) {
                      toast({ title: 'Passwords do not match', variant: 'destructive' });
                      return;
                    }
                    await api('/api/user/password', { method: 'PUT', token, body: { currentPassword, newPassword } });
                    toast({ title: 'Password updated' });
                    (document.getElementById('currentPassword') as HTMLInputElement).value = '';
                    (document.getElementById('newPassword') as HTMLInputElement).value = '';
                    (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
                  } catch (e) {
                    const message = e instanceof Error ? e.message : 'Unknown error';
                    toast({ title: 'Update failed', description: message, variant: 'destructive' });
                  }
                }}
                className="bg-gradient-mixed hover:opacity-90"
              >
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export your data or delete your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-save Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes as you work
                  </p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download a copy of your account data
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={async () => {
                      try {
                        if (!token) return;
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/user/export`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error('Export failed');
                        const blob = new Blob([await res.text()], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'prachaar-ai-export.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        const message = e instanceof Error ? e.message : 'Unknown error';
                        toast({ title: 'Export failed', description: message, variant: 'destructive' });
                      }
                    }}
                  >
                    Export Data
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all data
                  </p>
                  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-2">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is permanent and will remove your profile and associated data. You cannot undo this.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:opacity-90"
                          onClick={async () => {
                            try {
                              if (!token) return;
                              const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/user/me`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (!res.ok) throw new Error('Delete failed');
                              localStorage.removeItem('auth');
                              window.location.href = '/login';
                            } catch (e) {
                              const message = e instanceof Error ? e.message : 'Unknown error';
                              toast({ title: 'Delete failed', description: message, variant: 'destructive' });
                            }
                          }}
                        >
                          Confirm Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for better focus
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label>Theme Color</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose your preferred color scheme
                  </p>
                  <div className="flex gap-2 mt-3">
                    <div className="w-8 h-8 bg-gradient-mixed rounded-full cursor-pointer border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-publisher rounded-full cursor-pointer"></div>
                    <div className="w-8 h-8 bg-gradient-advertiser rounded-full cursor-pointer"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}