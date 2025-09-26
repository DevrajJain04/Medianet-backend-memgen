import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Users, Megaphone } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserType, setIsLoggedIn, setToken, setUser } = useUser();
  const { toast } = useToast();

  // Determine role from path: /publisher/login or /advertiser/login; null for /login
  const roleFromPath = useMemo<"publisher" | "advertiser" | null>(() => {
    if (location.pathname.startsWith("/publisher")) return "publisher";
    if (location.pathname.startsWith("/advertiser")) return "advertiser";
    return null;
  }, [location.pathname]);

  const [selectedUserType, setSelectedUserType] = useState<'publisher' | 'advertiser' | null>(roleFromPath);

  useEffect(() => {
    // Keep role in sync with path and lock selection to this role when provided
    if (roleFromPath) setSelectedUserType(roleFromPath);
  }, [roleFromPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const resp = await api<{ token: string; user: any }>(`/api/auth/login`, {
        method: 'POST',
        body: {
          email: (document.getElementById('email') as HTMLInputElement)?.value,
          password: (document.getElementById('password') as HTMLInputElement)?.value,
          role: selectedUserType ?? undefined,
        },
      });
      setToken(resp.token);
      setUser(resp.user);
      setIsLoggedIn(true);
      setUserType(resp.user.role);
      toast({ title: "Login successful", description: `Welcome ${resp.user.firstName}!` });
      navigate(resp.user.role === 'publisher' ? '/publisher' : '/advertiser');
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeSelect = (type: 'publisher' | 'advertiser') => {
    // Disabled: role is locked by route. Keep for safety in case of future use.
    setSelectedUserType(type);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserType) {
      toast({
        title: "Please select account type",
        description: "Choose whether you're a Publisher or Advertiser",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const resp = await api<{ token: string; user: any }>(`/api/auth/register`, {
        method: 'POST',
        body: {
          firstName: (document.getElementById('firstName') as HTMLInputElement)?.value,
          lastName: (document.getElementById('lastName') as HTMLInputElement)?.value,
          company: (document.getElementById('company') as HTMLInputElement)?.value,
          email: (document.getElementById('newEmail') as HTMLInputElement)?.value,
          password: (document.getElementById('newPassword') as HTMLInputElement)?.value,
          role: selectedUserType,
        },
      });
      setToken(resp.token);
      setUser(resp.user);
      setIsLoggedIn(true);
      setUserType(resp.user.role);
      toast({ title: "Account created", description: `Welcome ${resp.user.firstName}!` });
      navigate(resp.user.role === 'publisher' ? '/publisher' : '/advertiser');
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${roleFromPath === 'publisher' ? 'bg-publisher/5' : roleFromPath === 'advertiser' ? 'bg-advertiser/5' : 'bg-background'}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${roleFromPath === 'publisher' ? 'bg-gradient-publisher' : roleFromPath === 'advertiser' ? 'bg-gradient-advertiser' : 'bg-gradient-mixed'}`}>
              <Zap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Prachaar AI</h1>
          <p className="text-muted-foreground mt-2">
            {roleFromPath === 'publisher' ? 'Publisher Portal' : roleFromPath === 'advertiser' ? 'Advertiser Portal' : 'Advanced publisher-advertiser matching platform'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your dashboard and manage your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                {roleFromPath ? (
                  // Locked role view
                  <div className="space-y-2 mb-2 text-sm">
                    <Label>Signing in as</Label>
                    <div className={`inline-flex items-center gap-2 rounded-md px-3 py-2 border ${roleFromPath === 'publisher' ? 'bg-publisher/10 border-publisher/20 text-publisher' : 'bg-advertiser/10 border-advertiser/20 text-advertiser'}`}>
                      {roleFromPath === 'publisher' ? <Users className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                      <span className="text-xs uppercase tracking-wide">{roleFromPath}</span>
                    </div>
                  </div>
                ) : (
                  // Free selection view for /login
                  <div className="space-y-4 mb-4">
                    <Label>Login as:</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={selectedUserType === 'publisher' ? "default" : "outline"}
                        className={`h-16 flex-col gap-2 ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : ''}`}
                        onClick={() => setSelectedUserType('publisher')}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">Publisher</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedUserType === 'advertiser' ? "default" : "outline"}
                        className={`h-16 flex-col gap-2 ${selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : ''}`}
                        onClick={() => setSelectedUserType('advertiser')}
                      >
                        <Megaphone className="w-5 h-5" />
                        <span className="text-xs">Advertiser</span>
                      </Button>
                    </div>
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sarah@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className={`w-full ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : 'bg-gradient-mixed'} hover:opacity-90`}
                    disabled={isLoading || !selectedUserType}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                {roleFromPath ? (
                  // Locked role view
                  <div className="space-y-2 mb-2 text-sm">
                    <Label>Creating account as</Label>
                    <div className={`inline-flex items-center gap-2 rounded-md px-3 py-2 border ${roleFromPath === 'publisher' ? 'bg-publisher/10 border-publisher/20 text-publisher' : 'bg-advertiser/10 border-advertiser/20 text-advertiser'}`}>
                      {roleFromPath === 'publisher' ? <Users className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                      <span className="text-xs uppercase tracking-wide">{roleFromPath}</span>
                    </div>
                  </div>
                ) : (
                  // Free selection view for /login
                  <div className="space-y-4 mb-4">
                    <Label>Create account as:</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={selectedUserType === 'publisher' ? "default" : "outline"}
                        className={`h-16 flex-col gap-2 ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : ''}`}
                        onClick={() => setSelectedUserType('publisher')}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">Publisher</span>
                      </Button>
                      <Button
                        type="button"
                        variant={selectedUserType === 'advertiser' ? "default" : "outline"}
                        className={`h-16 flex-col gap-2 ${selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : ''}`}
                        onClick={() => setSelectedUserType('advertiser')}
                      >
                        <Megaphone className="w-5 h-5" />
                        <span className="text-xs">Advertiser</span>
                      </Button>
                    </div>
                  </div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Sarah" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Chen" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Your Company" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email</Label>
                    <Input id="newEmail" type="email" placeholder="sarah@company.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" required />
                  </div>
                  <Button 
                    type="submit" 
                    className={`w-full ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : 'bg-gradient-mixed'} hover:opacity-90`}
                    disabled={isLoading || !selectedUserType}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}