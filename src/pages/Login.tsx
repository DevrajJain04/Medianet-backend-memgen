import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Users, Megaphone } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<'publisher' | 'advertiser' | null>(null);
  const navigate = useNavigate();
  const { setUserType, setIsLoggedIn } = useUser();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      setUserType(selectedUserType);
      
      toast({
        title: "Login successful",
        description: `Welcome ${selectedUserType}!`,
      });
      
      // Route based on user type
      if (selectedUserType === 'publisher') {
        navigate("/publisher");
      } else if (selectedUserType === 'advertiser') {
        navigate("/advertiser");
      } else {
        navigate("/dashboard");
      }
    }, 1500);
  };

  const handleUserTypeSelect = (type: 'publisher' | 'advertiser') => {
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
    
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      setUserType(selectedUserType);
      
      toast({
        title: "Account created successfully",
        description: `Welcome to Dual-Score AdTech as a ${selectedUserType}!`,
      });
      
      // Route based on user type
      if (selectedUserType === 'publisher') {
        navigate("/publisher");
      } else if (selectedUserType === 'advertiser') {
        navigate("/advertiser");
      } else {
        navigate("/dashboard");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-mixed rounded-xl flex items-center justify-center">
              <Zap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Dual-Score AdTech</h1>
          <p className="text-muted-foreground mt-2">
            Advanced publisher-advertiser matching platform
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
                <div className="space-y-4 mb-4">
                  <Label>Login as:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button"
                      variant={selectedUserType === 'publisher' ? "default" : "outline"} 
                      className={`h-16 flex-col gap-2 ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : ''}`}
                      onClick={() => handleUserTypeSelect('publisher')}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Publisher</span>
                    </Button>
                    <Button 
                      type="button"
                      variant={selectedUserType === 'advertiser' ? "default" : "outline"} 
                      className={`h-16 flex-col gap-2 ${selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : ''}`}
                      onClick={() => handleUserTypeSelect('advertiser')}
                    >
                      <Megaphone className="w-5 h-5" />
                      <span className="text-xs">Advertiser</span>
                    </Button>
                  </div>
                </div>
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
                    className="w-full bg-gradient-mixed hover:opacity-90"
                    disabled={isLoading || !selectedUserType}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                <div className="space-y-4 mb-4">
                  <Label>Create account as:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button"
                      variant={selectedUserType === 'publisher' ? "default" : "outline"} 
                      className={`h-16 flex-col gap-2 ${selectedUserType === 'publisher' ? 'bg-gradient-publisher' : ''}`}
                      onClick={() => handleUserTypeSelect('publisher')}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-xs">Publisher</span>
                    </Button>
                    <Button 
                      type="button"
                      variant={selectedUserType === 'advertiser' ? "default" : "outline"} 
                      className={`h-16 flex-col gap-2 ${selectedUserType === 'advertiser' ? 'bg-gradient-advertiser' : ''}`}
                      onClick={() => handleUserTypeSelect('advertiser')}
                    >
                      <Megaphone className="w-5 h-5" />
                      <span className="text-xs">Advertiser</span>
                    </Button>
                  </div>
                </div>
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
                    className="w-full bg-gradient-mixed hover:opacity-90"
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